import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// Full WYSIWYG (Quill) for the two long-text fields that the legacy portal edits with
// CKEditor. Images are inserted by URL so the stored HTML stays small.
const TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link", "image"],
  ["clean"],
];

function Editor({ id, value, onChange, onBlur, describedBy, invalid, readOnly }) {
  const host = useRef(null);
  const quill = useRef(null);
  const silent = useRef(false);
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    const q = new Quill(host.current, {
      theme: "snow",
      readOnly,
      placeholder: "Tulis di sini…",
      modules: {
        toolbar: {
          container: TOOLBAR,
          handlers: {
            image() {
              const url = window.prompt("URL gambar (https://…)");
              if (!url || !/^https?:\/\//i.test(url)) return;
              const range = q.getSelection(true);
              q.insertEmbed(range.index, "image", url, "user");
              q.setSelection(range.index + 1);
            },
          },
        },
      },
    });
    q.root.setAttribute("aria-multiline", "true");
    if (value) q.clipboard.dangerouslyPasteHTML(value);

    const handler = () => {
      if (!silent.current) change.current(q.root.innerHTML);
    };
    q.on("text-change", handler);

    // Keep the caret in the editor when a toolbar button is pressed. Browsers move focus
    // to the button, which makes Quill lose its range and the format do nothing.
    const toolbar = q.getModule("toolbar").container;
    let savedRange = null;
    const remember = (range) => {
      if (range) savedRange = range;
    };
    q.on("selection-change", remember);
    const keepFocus = (event) => {
      event.preventDefault();
      q.focus();
      if (savedRange) q.setSelection(savedRange);
    };
    toolbar.addEventListener("mousedown", keepFocus);

    quill.current = q;
    const mount = host.current;
    return () => {
      toolbar.removeEventListener("mousedown", keepFocus);
      q.off("selection-change", remember);
      q.off("text-change", handler);
      // Quill inserts the toolbar as a sibling of its host, so emptying the host is not
      // enough: a StrictMode remount would leave a dead toolbar behind.
      toolbar.remove();
      quill.current = null;
      mount.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External updates (loading a draft, reset) must not fight the caret while typing:
  // our own text-change already keeps `value` identical to root.innerHTML.
  useEffect(() => {
    const q = quill.current;
    if (!q || value === q.root.innerHTML) return;
    silent.current = true;
    const range = q.getSelection();
    q.clipboard.dangerouslyPasteHTML(value || "");
    silent.current = false;
    if (range) q.setSelection(Math.min(range.index, Math.max(q.getLength() - 1, 0)));
  }, [value]);

  useEffect(() => {
    const q = quill.current;
    q?.enable(!readOnly);
    const bar = q?.getModule("toolbar")?.container;
    if (bar) bar.style.display = readOnly ? "none" : "";
  }, [readOnly]);

  return (
    <div
      id={id}
      className="rich-text"
      data-invalid={invalid ? "true" : undefined}
      aria-describedby={describedBy}
      onBlur={onBlur}
    >
      <div ref={host} />
    </div>
  );
}

export function RichText({ control, name, describedBy, invalid, readOnly = false }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Editor
          id={name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          describedBy={describedBy}
          invalid={invalid}
          readOnly={readOnly}
        />
      )}
    />
  );
}
