import { FilePlus2, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

export default function PengajuanBaruListPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
              Pengajuan baru
            </h1>
            <p className="mt-1 max-w-[56ch] text-[13.5px] text-ink-soft">
              Ajukan protokol kaji etik baru. Pengajuan tersimpan sebagai draf sampai Anda
              mengirimkannya.
            </p>
          </div>
          <Link to="/app/pengajuan-baru/baru">
            <Button>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Ajukan baru
            </Button>
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-line bg-surface">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-canvas-deep text-ink-faint">
              <Inbox className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-[17px] font-semibold text-ink">
              Belum ada pengajuan
            </h2>
            <p className="mt-1.5 max-w-[48ch] text-[13.5px] leading-relaxed text-ink-soft">
              Daftar pengajuan akan muncul di sini setelah Anda membuat draf pertama. Data
              masih berupa contoh sampai backend tersambung.
            </p>
            <Link to="/app/pengajuan-baru/baru" className="mt-5">
              <Button variant="secondary">
                Mulai pengajuan
                <FilePlus2 className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
