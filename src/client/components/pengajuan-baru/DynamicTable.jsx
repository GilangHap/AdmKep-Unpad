import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/FormControl";

export function DynamicRows({ control, register, name, columns, addLabel }) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="sm:col-span-2">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead className="bg-canvas-deep">
            <tr>
              <th className="w-10 px-3 py-2 text-[12px] font-semibold text-ink-faint">No</th>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-[12px] font-semibold text-ink-faint">
                  {c.label}
                </th>
              ))}
              <th className="w-16 px-3 py-2 text-[12px] font-semibold text-ink-faint">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td className="px-3 py-2 text-[13px] text-ink-faint">{index + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    <Input
                      aria-label={`${c.label} baris ${index + 1}`}
                      placeholder={c.placeholder}
                      className="h-10"
                      {...register(`${name}.${index}.${c.key}`)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Hapus baris ${index + 1}`}
                    className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-faint hover:bg-canvas hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => append({})}
        className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-gold-deep hover:underline"
      >
        <Plus className="size-4" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}
