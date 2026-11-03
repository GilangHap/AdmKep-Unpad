import { ArrowRight, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

export default function ModulePage({ title, description }) {

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1240px] px-5 py-6 sm:px-6">
        <h1 className="sr-only">{title}</h1>
        <p className="max-w-[62ch] text-[13.5px] text-ink-soft">{description}</p>

        <div className="mt-5 max-w-[72ch]">
          <section className="rounded-xl border border-line bg-surface p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-canvas-deep text-ink-soft">
              <Construction className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3.5 font-display text-[17px] font-semibold text-ink">
              Modul ini sedang dibangun
            </h2>
            <p className="mt-1.5 max-w-[58ch] text-[13.5px] leading-relaxed text-ink-soft">
              Rute dan kerangka navigasinya sudah siap. Tabel, formulir, dan unggah
              dokumennya menyusul pada tahap berikutnya.
            </p>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[12px] text-ink-faint">Yang akan tersedia di sini</p>
              <ul className="mt-2.5 space-y-2">
                {[
                  "Daftar berkas beserta status terakhirnya",
                  "Formulir isian sesuai jenis pengajuan",
                  "Unggah dokumen dan pratinjau berkas",
                  "Riwayat kirim dan catatan petugas",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13.5px] text-ink-soft">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-control" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link to="/app/dasbor" className="mt-6 inline-block">
              <Button size="md">
                Kembali ke dasbor
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
