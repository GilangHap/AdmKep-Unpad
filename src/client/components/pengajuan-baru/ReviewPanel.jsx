import { Alert } from "@/components/ui/Alert";

const LABELS = {
  n_peneliti_u: "Peneliti utama",
  n_judul: "Judul penelitian",
  ver_pro: "Versi protokol",
  n_institusi_pengusul: "Instansi",
  c_jenjang: "Jenjang",
  c_dana: "Sumber dana",
  jum_partisipan: "Jumlah partisipan",
  n_tempat_penelitian: "Tempat penelitian",
  d_awal: "Mulai",
  d_akhir: "Selesai",
  d_rekrutmen: "Mulai rekrutmen",
};

export function ReviewPanel({ values, agreed, onAgree, readOnly = false }) {
  return (
    <div className="mt-6">
      <Alert tone="info" title={readOnly ? "Ringkasan pengajuan" : "Periksa kembali sebelum mengirim"}>
        {readOnly
          ? "Pengajuan sudah dikirim dan menunggu verifikasi petugas."
          : "Setelah dikirim, pengajuan masuk antrean verifikasi petugas dan tidak dapat diubah dari halaman ini."}
      </Alert>

      <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3">
            <dt className="text-[13px] text-ink-faint">{label}</dt>
            <dd className="max-w-[62ch] text-right text-[13.5px] font-medium text-ink">
              {values[key] || "-"}
            </dd>
          </div>
        ))}
      </dl>

      {readOnly ? null : (
        <label className="mt-4 flex items-start gap-2.5 text-[13.5px] text-ink-soft">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => onAgree(e.target.checked)}
            className="mt-0.5 size-4 accent-[#003d7a]"
          />
          <span>
            Saya menyatakan data ini benar dan penelitian mengikuti Deklarasi Helsinki serta
            ketentuan Komite Etik Penelitian Unpad.
          </span>
        </label>
      )}
    </div>
  );
}
