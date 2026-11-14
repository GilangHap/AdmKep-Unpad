import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Inbox,
  MessageCircle,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { CONTACTS } from "@/lib/dashboardData";
import { deletePengajuan, listPengajuan } from "@/lib/pengajuanBaruApi";
import { SECTION_META, sectionsFor } from "@/lib/pengajuanSections";

const TABS = [
  { id: "all", label: "Semua" },
  { id: "draft", label: "Draf" },
  { id: "sent", label: "Sudah dikirim" },
];

const SORTS = [
  { id: "baru", label: "Terbaru" },
  { id: "lama", label: "Terlama" },
  { id: "judul", label: "Judul A-Z" },
];

const isDraft = (status) => /inputan|draf/i.test(status ?? "");
// Status tetap "-1" setelah dikirim: yang membedakan draf dan terkirim adalah tanggal kirim.
// Baris lama yang telanjur berstatus selain "-1" juga dianggap sudah dikirim.
const isSent = (item) =>
  Boolean(item.dikirimPada) || (item.statusKode ? item.statusKode !== "-1" : false);

// Hanya baris berstatus "-1" (masih inputan) yang boleh dihapus.
const canDelete = (item) => item.statusKode === "-1";

const statusTone = (status) => {
  if (isDraft(status)) return "neutral";
  if (/terima|layak|setuju|selesai/i.test(status)) return "positive";
  if (/tolak|kurang|perbaiki|revisi|dikembalikan/i.test(status)) return "danger";
  return "info";
};

function recency(value) {
  if (!value) return "-";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Meta({ item }) {
  const identity = [
    ["Peneliti", item.peneliti],
    ["CP", item.hp ? `${item.cp || "-"} (${item.hp})` : item.cp],
    ["Institusi", item.institusi],
  ].filter(([, value]) => value);

  const parts = [
    item.kelompok,
    item.jenisData,
    item.peruntukan,
    item.statusKode === "8" ? null : item.statusAksi,
    isSent(item) ? "Terkirim" : null,
    `Diperbarui ${recency(item.diubahPada ?? item.dibuatPada)}`,
  ].filter(Boolean);

  return (
    <>
      {identity.length > 0 ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] leading-5 text-ink-soft">
          {identity.map(([label, value], index) => (
            <span
              key={label}
              className="flex w-full items-center gap-2 whitespace-nowrap md:w-auto"
            >
              {index > 0 ? (
                <span aria-hidden="true" className="hidden text-ink-faint md:inline">
                  ·
                </span>
              ) : null}
              <span>
                <span className="font-medium text-ink">{label}:</span> {value}
              </span>
            </span>
          ))}
        </p>
      ) : null}
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] leading-5 text-ink-faint">
        {parts.map((part, index) => (
          <span key={part} className="flex items-center gap-2 whitespace-nowrap">
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            {part}
          </span>
        ))}
      </p>
    </>
  );
}

// Isi panel mengikuti "Lengkapi Data Pengajuan" di portal legacy; susunannya dibuat dua kolom.
const SECTION_HINTS = {
  b: "Metode dan prosedur penelitian",
  bcd: "Metode, PSP, dan kerahasiaan",
  c: "Proses persetujuan partisipan",
  d: "Isi penjelasan untuk partisipan",
  li: "Naskah informasi untuk partisipan",
  biodata: "Data peneliti dan pembimbing",
  e: "Pernyataan ketua pelaksana",
};

function LengkapiPanel({ item, variant }) {
  const sections = sectionsFor(item.kelompokKode);
  const kelompok = String(item.kelompokKode ?? "");
  const withLi = ["1", "2", "3", "4", "5"].includes(kelompok);
  const cetak = [
    ["etik", "Formulir etik"],
    ["biodata", "Biodata peneliti"],
    ...(withLi ? [["li", "Lembar informasi"]] : []),
    ...(withLi || kelompok === "7"
      ? [["psp", kelompok === "7" ? "PSP laporan kasus" : "PSP"]]
      : []),
    ["helsinki", "Deklarasi Helsinki"],
  ];
  return (
    <div
      id={`lengkapi-${variant}-${item.id}`}
      className="rounded-xl bg-canvas p-3 sm:p-4"
    >
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:gap-8">
        <section>
          <div className="flex items-baseline justify-between gap-3 px-2.5">
            <h3 className="text-[13px] font-semibold text-ink">Lengkapi data pengajuan</h3>
            <span className="shrink-0 text-[12px] tabular-nums text-ink-faint">
              {sections.length} bagian
            </span>
          </div>
          <ul className="mt-1.5">
            {sections.map((slug) => (
              <li key={slug}>
                <Link
                  to={`/app/pengajuan-baru/${item.id}/bagian/${slug}`}
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-150 hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">
                      {SECTION_META[slug].label}
                    </span>
                    <span className="block text-[12px] leading-4 text-ink-faint">
                      {SECTION_HINTS[slug]}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="px-2.5">
            <h3 className="text-[13px] font-semibold text-ink">Dokumen</h3>
            <p className="mt-0.5 text-[12px] leading-4 text-ink-faint">
              Cetak di tab baru atau unggah berkas pendukung.
            </p>
          </div>
          <ul className="mt-1.5">
            {cetak.map(([jenis, label]) => (
              <li key={jenis}>
                <a
                  href={`/app/pengajuan-baru/${item.id}/cetak?jenis=${jenis}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-150 hover:bg-surface"
                >
                  <Printer className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{label}</span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-ink-faint transition-colors duration-150 group-hover:text-brand"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
            <li className="mt-1.5 border-t border-line pt-1.5">
              <Link
                to={`/app/pengajuan-baru/${item.id}/dokumen`}
                className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-150 hover:bg-surface"
              >
                <Upload className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">Unggah dokumen</span>
                  <span className="block text-[12px] leading-4 text-ink-faint">
                    Protokol, surat pengantar, bukti pembayaran
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden="true"
                />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-4 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

function HelpPanel() {
  return (
    <details className="group mt-6 rounded-xl bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13.5px] font-medium text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-ink-soft">
          Butuh bantuan? Hubungi petugas pengajuan sesuai jenis penelitian Anda.
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {CONTACTS.map((contact) => (
          <li
            key={contact.name}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{contact.name}</p>
              <p className="text-[12.5px] leading-5 text-ink-soft">{contact.scope}</p>
            </div>
            <a
              href={contact.wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand hover:text-brand-deep"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {contact.phone}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function PengajuanBaruListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const justSubmitted = searchParams.get("terkirim") === "1";
  const [state, setState] = useState({ status: "loading", items: [], error: "" });
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("baru");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading", error: "" }));
    return listPengajuan()
      .then((items) => setState({ status: "ready", items, error: "" }))
      .catch((err) => setState({ status: "error", items: [], error: err.message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const askDelete = (item) => {
    setDeleteError("");
    setPendingDelete(item);
  };

  const closeDelete = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePengajuan(pendingDelete.id);
      setNotice(
        `Pengajuan "${pendingDelete.judul || "Tanpa judul"}" dihapus.`,
      );
      setPendingDelete(null);
      await load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const { status, items, error } = state;

  const counts = useMemo(() => {
    const sent = items.filter(isSent).length;
    return { all: items.length, draft: items.length - sent, sent };
  }, [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (tab === "draft" && isSent(item)) return false;
      if (tab === "sent" && !isSent(item)) return false;
      if (!q) return true;
      return `${item.judul ?? ""} ${item.kode ?? ""}`.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      if (sort === "judul") return (a.judul ?? "").localeCompare(b.judul ?? "", "id");
      const at = new Date(a.diubahPada ?? a.dibuatPada ?? 0).getTime();
      const bt = new Date(b.diubahPada ?? b.dibuatPada ?? 0).getTime();
      return sort === "lama" ? at - bt : bt - at;
    });
  }, [items, tab, query, sort]);

  const isFirstRun = status === "ready" && items.length === 0;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
              Pengajuan baru
            </h1>
            <p className="mt-1 max-w-[60ch] text-[14px] leading-6 text-ink-soft">
              Protokol tersimpan sebagai draf sampai Anda mengirimkannya ke petugas.
            </p>
          </div>
          <Link to="/app/pengajuan-baru/baru">
            <Button size="sm">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Tambah pengajuan baru
            </Button>
          </Link>
        </div>

        {justSubmitted ? (
          <Alert tone="success" title="Pengajuan terkirim" className="mt-4">
            <p>
              Pengajuan masuk antrean verifikasi petugas. Isian lain masih bisa Anda perbarui
              sampai petugas memverifikasi.
            </p>
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="mt-1 cursor-pointer font-semibold underline underline-offset-2"
            >
              Tutup
            </button>
          </Alert>
        ) : null}

        {notice ? (
          <Alert tone="success" title="Pengajuan dihapus" className="mt-4">
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="mt-1 cursor-pointer font-semibold underline underline-offset-2"
            >
              Tutup
            </button>
          </Alert>
        ) : null}

        <Alert tone="info" className="mt-4">
          Formulir etik harus ditulis dalam Bahasa Indonesia.
        </Alert>

        <div className="mt-6 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div role="tablist" aria-label="Status pengajuan" className="flex gap-5 sm:gap-6">
            {TABS.map((option) => {
              const active = tab === option.id;
              return (
                <button
                  key={option.id}
                  id={`tab-${option.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="pengajuan-panel"
                  onClick={() => setTab(option.id)}
                  className={`-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 pb-2.5 text-[14px] transition-colors ${
                    active
                      ? "border-brand font-semibold text-brand"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {option.label}
                  <span className="text-[12.5px] font-normal tabular-nums text-ink-faint">
                    {counts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-[340px]">
            <label htmlFor="cari-pengajuan" className="sr-only">
              Cari pengajuan
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              id="cari-pengajuan"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul atau nomor registrasi"
              className="h-10 w-full rounded-lg border border-control bg-surface pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span aria-live="polite" className="text-[12.5px] tabular-nums text-ink-faint">
              {rows.length} dari {items.length} pengajuan
            </span>
            <label htmlFor="urutkan" className="sr-only">
              Urutkan
            </label>
            <select
              id="urutkan"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 cursor-pointer rounded-lg border border-control bg-surface px-2.5 text-[13px] text-ink focus:border-brand focus:outline-none"
            >
              {SORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section id="pengajuan-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-2">
          {status === "loading" ? (
            <RowsSkeleton />
          ) : status === "error" ? (
            <div className="mt-4 rounded-xl bg-surface p-4">
              <Alert tone="error" title="Gagal memuat pengajuan">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-2 cursor-pointer font-semibold text-red underline underline-offset-2"
                >
                  Coba lagi
                </button>
              </Alert>
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-control px-6 py-10 text-center">
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-canvas-deep text-ink-faint">
                <Inbox className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14.5px] font-semibold text-ink">
                {isFirstRun && tab === "all" && !query
                  ? "Belum ada pengajuan"
                  : "Tidak ada pengajuan yang cocok"}
              </p>
              <p className="mx-auto mt-1 max-w-[46ch] text-[13px] leading-5 text-ink-soft">
                {isFirstRun && tab === "all" && !query
                  ? "Draf pertama Anda akan muncul di sini dan bisa dilanjutkan kapan saja."
                  : "Ubah kata kunci, status, atau urutan pencarian."}
              </p>
              {isFirstRun && tab === "all" && !query ? (
                <Link to="/app/pengajuan-baru/baru" className="mt-4 inline-block">
                  <Button size="sm">
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    Tambah pengajuan baru
                  </Button>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTab("all");
                    setQuery("");
                  }}
                  className="mt-3 cursor-pointer text-[13px] font-semibold text-brand hover:text-brand-deep"
                >
                  Tampilkan semua pengajuan
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="hidden w-full border-collapse text-left md:table">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-10 pb-2 pr-4 text-[12px] font-normal text-ink-faint"
                    >
                      No
                    </th>
                    <th
                      scope="col"
                      className="pb-2 pr-4 text-[12px] font-normal text-ink-faint"
                    >
                      Uraian
                    </th>
                    <th
                      scope="col"
                      className="w-40 pb-2 pr-4 text-[12px] font-normal text-ink-faint"
                    >
                      Status
                    </th>
                    <th scope="col" className="w-56 pb-2">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, index) => (
                    <Fragment key={item.id}>
                      <tr
                        className="border-t border-line align-middle transition-colors hover:bg-canvas"
                      >
                        <td className="py-4 pr-4 align-top text-[12.5px] tabular-nums text-ink-faint">
                          {index + 1}
                        </td>
                        <td className="py-4 pr-4">
                          <Link
                            to={`/app/pengajuan-baru/${item.id}`}
                            className="text-[14.5px] font-semibold leading-snug text-ink hover:text-brand"
                          >
                            {item.judul || "(Belum ada judul)"}
                          </Link>
                          <Meta item={item} />
                        </td>
                        <td className="py-4 pr-4">
                          <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/app/pengajuan-baru/${item.id}`}
                              className="px-1.5 py-1 text-[13px] font-semibold text-brand hover:text-brand-deep"
                            >
                              Buka
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenId((current) => (current === item.id ? null : item.id))
                              }
                              aria-expanded={openId === item.id}
                              aria-controls={`lengkapi-desktop-${item.id}`}
                              className="flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-semibold text-ink-soft transition-colors duration-150 hover:bg-canvas-deep hover:text-brand"
                            >
                              Lengkapi data
                              <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${openId === item.id ? "rotate-180" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                            {canDelete(item) ? (
                              <button
                                type="button"
                                onClick={() => askDelete(item)}
                                aria-label={`Hapus pengajuan ${item.judul || "tanpa judul"}`}
                                title="Hapus pengajuan"
                                className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors duration-150 hover:bg-canvas-deep hover:text-red"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {openId === item.id ? (
                        <tr className="border-t border-line/70">
                          <td colSpan={4} className="pb-4">
                            <LengkapiPanel item={item} variant="desktop" />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>

              <ul className="divide-y divide-line md:hidden">
                {rows.map((item, index) => (
                  <li key={item.id} className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/app/pengajuan-baru/${item.id}`}
                          className="text-[14.5px] font-semibold leading-snug text-ink"
                        >
                          <span
                            className="mr-2 text-[12.5px] font-normal tabular-nums text-ink-faint"
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          {item.judul || "(Belum ada judul)"}
                        </Link>
                        <Meta item={item} />
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenId((current) => (current === item.id ? null : item.id))
                            }
                            aria-expanded={openId === item.id}
                            aria-controls={`lengkapi-mobile-${item.id}`}
                            className="flex cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-ink-soft"
                          >
                            Lengkapi data
                            <ChevronDown
                              className={`size-3.5 transition-transform duration-200 ${openId === item.id ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          to={`/app/pengajuan-baru/${item.id}`}
                          className="px-1.5 py-2 text-[13px] font-semibold text-brand"
                        >
                          Buka
                        </Link>
                        {canDelete(item) ? (
                          <button
                            type="button"
                            onClick={() => askDelete(item)}
                            aria-label={`Hapus pengajuan ${item.judul || "tanpa judul"}`}
                            title="Hapus pengajuan"
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors duration-150 hover:bg-canvas-deep hover:text-red"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {openId === item.id ? (
                      <div className="mt-3">
                        <LengkapiPanel item={item} variant="mobile" />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {status === "ready" ? <HelpPanel /> : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus pengajuan ini?"
        description="Data isian dan dokumen yang sudah diunggah ikut terhapus. Tindakan ini tidak dapat dibatalkan."
        detail={
          pendingDelete
            ? `No. ${pendingDelete.id} · ${pendingDelete.judul || "Tanpa judul"}`
            : ""
        }
        confirmLabel="Hapus pengajuan"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      />
    </AppShell>
  );
}
