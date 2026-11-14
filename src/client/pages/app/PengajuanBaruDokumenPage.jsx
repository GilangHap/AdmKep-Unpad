import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import {
  deletePengajuanDokumen,
  getPengajuanDokumen,
  uploadPengajuanDokumen,
} from "@/lib/pengajuanBaruApi";

const SLOTS = [
  {
    urutan: 1,
    label: "Protokol / Proposal",
    hint: "Mohon Lembar Pengesahan dan Bab 1 sampai Bab 3 saja dalam bentuk PDF",
  },
  { urutan: 3, label: "Surat Pengantar", hint: "Mohon file dalam bentuk PDF" },
  { urutan: 4, label: "Bukti Pembayaran", hint: "" },
];

const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PengajuanBaruDokumenPage() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [item, setItem] = useState(null);
  const [dokumen, setDokumen] = useState([]);
  const [busy, setBusy] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    getPengajuanDokumen(id)
      .then((data) => {
        setItem(data.item);
        setDokumen(data.dokumen ?? []);
        setStatus("ready");
      })
      .catch((err) => {
        setLoadError(err.message ?? "Gagal memuat dokumen.");
        setStatus("error");
      });

  useEffect(() => {
    setStatus("loading");
    load();
  }, [id]); // ponytail: one fetch per submission id.

  const pick = async (urutan, file) => {
    if (!file) return;
    setNotice("");
    setError("");
    if (file.size > MAX_BYTES) {
      setError("Ukuran file melebihi 10 MB.");
      return;
    }
    setBusy(urutan);
    try {
      await uploadPengajuanDokumen(id, urutan, file);
      await load();
      setNotice("Dokumen tersimpan.");
    } catch (err) {
      setError(err.message ?? "Gagal mengunggah file.");
    } finally {
      setBusy(0);
    }
  };

  const remove = async (urutan) => {
    setNotice("");
    setError("");
    setBusy(urutan);
    try {
      await deletePengajuanDokumen(id, urutan);
      await load();
      setNotice("Dokumen dihapus.");
    } catch (err) {
      setError(err.message ?? "Gagal menghapus file.");
    } finally {
      setBusy(0);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/app/pengajuan-baru"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-brand"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Pengajuan baru
        </Link>

        <div className="mt-3">
          <h1 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">
            Form Upload Dokumen Pengajuan
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            Unggah protokol, surat pengantar, dan bukti pembayaran untuk pengajuan ini.
          </p>
        </div>

        {notice ? (
          <Alert tone="success" className="mt-4" title={notice}>
            <button type="button" onClick={() => setNotice("")} className="cursor-pointer underline">
              Tutup
            </button>
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="error" className="mt-4" title={error}>
            <button type="button" onClick={() => setError("")} className="cursor-pointer underline">
              Tutup
            </button>
          </Alert>
        ) : null}

        {status === "loading" ? (
          <p className="mt-8 text-[14px] text-ink-soft">Memuat dokumen…</p>
        ) : status === "error" ? (
          <Alert tone="error" className="mt-8" title="Gagal memuat dokumen">
            {loadError}
          </Alert>
        ) : (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <dl className="grid gap-1 text-[14px]">
              <div className="flex gap-2">
                <dt className="w-[150px] shrink-0 text-ink-faint">No. registrasi</dt>
                <dd className="font-semibold text-ink">{item?.kode || "Belum diterbitkan"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-[150px] shrink-0 text-ink-faint">Nama peneliti</dt>
                <dd className="font-semibold text-ink">{item?.peneliti || "-"}</dd>
              </div>
            </dl>

            <p className="mt-4 text-[13px] leading-5 text-ink-soft">
              Untuk Formulir Etik harus mencantumkan No. Registrasi, dan disertai dengan tanda tangan
              discan.
            </p>
            <p className="mt-1 text-[13px] leading-5 text-ink-soft">
              Upload file (maksimum 10 MB, file harus PDF).
            </p>

            <ul className="mt-4 divide-y divide-line border-t border-line">
              {SLOTS.map((slot) => {
                const doc = dokumen.find((d) => d.urutan === slot.urutan);
                const idInput = `dokumen-${slot.urutan}`;
                return (
                  <li key={slot.urutan} className="py-4">
                    <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                      <p className="text-[14px] font-medium text-ink">
                        {slot.urutan}. {slot.label}
                      </p>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <input
                            id={idInput}
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            disabled={busy === slot.urutan}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              pick(slot.urutan, file);
                            }}
                          />
                          <label
                            htmlFor={idInput}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-control bg-canvas px-3 text-[13px] font-medium text-ink transition-colors duration-150 hover:border-brand hover:text-brand"
                          >
                            <Upload className="size-4" aria-hidden="true" />
                            {doc ? "Ganti file" : "Pilih file"}
                          </label>
                          <span className="text-[12px] leading-4 text-ink-faint">
                            {busy === slot.urutan ? "Mengunggah…" : "PDF · maks 10 MB"}
                          </span>
                        </div>

                        {doc ? (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <FileText className="size-4 shrink-0 text-brand" aria-hidden="true" />
                            <a
                              href={`/api/pengajuan-baru/${id}/dokumen/${slot.urutan}/file`}
                              className="inline-flex min-w-0 items-center gap-1 text-[13px] text-brand hover:underline"
                            >
                              <span className="truncate">{doc.nama || "Dokumen"}</span>
                              <Download className="size-3.5 shrink-0" aria-hidden="true" />
                            </a>
                            <span className="text-[12px] text-ink-faint">{formatSize(doc.ukuran)}</span>
                            <button
                              type="button"
                              onClick={() => remove(slot.urutan)}
                              disabled={busy === slot.urutan}
                              className="inline-flex cursor-pointer items-center gap-1 text-[12.5px] text-red hover:underline disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" /> Hapus
                            </button>
                          </div>
                        ) : null}

                        {slot.hint ? (
                          <p className="mt-2 text-[12px] leading-4 text-ink-faint">{slot.hint}</p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-[12px] leading-4 text-red">
              Nama file tidak boleh mengandung karakter khusus seperti % - ( ) $ # &amp; @ * ^
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
