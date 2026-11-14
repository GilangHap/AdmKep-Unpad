import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { sectionSchema } from "@/lib/pengajuanSections";
import { getPengajuanPrint } from "@/lib/pengajuanBaruApi";
import { JENJANG, KERJASAMA, PERUNTUKAN, SUMBER_DANA, STATUS_ETIK_LAIN } from "@/lib/pengajuanBaruData";

const YA_TIDAK = { Y: "Ya", T: "Tidak", YA: "Ya", TIDAK: "Tidak", N: "Tidak" };

const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  const text = String(v).trim();
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return text.split(",").map((x) => x.trim()).filter(Boolean);
};

const isoDay = (v) => {
  const t = String(v ?? "");
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : t;
};

const pick = (list, value) => list.find((o) => o.value === value)?.label ?? value ?? "";

function labelOf(field, value) {
  if (value === "" || value == null) return "-";
  if (field.options?.length) {
    return asArray(value)
      .map((v) => field.options.find((o) => String(o.value) === String(v))?.label ?? v)
      .join(", ");
  }
  return String(value);
}

function visible(field, values) {
  const cond = field.showIf;
  if (!cond) return true;
  if (Array.isArray(cond)) return cond.some((c) => visible({ showIf: c }, values));
  if (cond.includes) return asArray(values[cond.field]).includes(cond.includes);
  return String(values[cond.field] ?? "") === cond.is;
}

function flag(v) {
  if (v === "" || v == null) return "-";
  return YA_TIDAK[String(v).trim()] ?? String(v);
}

function Rows({ rows }) {
  return (
    <table className="ck-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="ck-label">{label}</td>
            <td className="ck-value">{value === "" || value == null ? "-" : value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Section list + values for one printable form (B/C/D or the combined B,C,D).
function SectionBlocks({ schema, data }) {
  const values = useMemo(() => data ?? {}, [data]);
  return schema.groups.map((group) => {
    const fields = group.fields.filter((f) => f.type !== "repeater" && visible(f, values));
    if (!fields.length) return null;
    return (
      <section key={group.key} className="ck-section">
        <h4 className="ck-section-title">{group.label}</h4>
        <table className="ck-table">
          <tbody>
            {fields.map((f) =>
              f.type === "note" ? (
                <tr key={f.name}>
                  <td className="ck-value" colSpan={2}>
                    {f.text}
                  </td>
                </tr>
              ) : (
              <tr key={f.name}>
                <td className="ck-label">{f.label.replace(/\s\*$/, "")}</td>
                <td className="ck-value">
                  {f.type === "textarea" || f.type === "text" ? (
                    <span className="ck-pre">{String(values[f.name] ?? "").trim() || "-"}</span>
                  ) : f.type === "date" ? (
                    isoDay(values[f.name]) || "-"
                  ) : (
                    labelOf(f, values[f.name])
                  )}
                </td>
              </tr>
              ),
            )}
          </tbody>
        </table>
        {group.fields
          .filter((f) => f.type === "repeater")
          .map((f) => {
            const rows = asArray(values[f.name]).filter((row) => Object.values(row ?? {}).some((x) => String(x ?? "").trim()));
            if (!rows.length) return null;
            return (
              <div key={f.name} className="ck-repeat">
                <p className="ck-repeat-title">{f.label}</p>
                {rows.map((row, i) => (
                  <table key={i} className="ck-table">
                    <tbody>
                      {f.rows.map((rf) => (
                        <tr key={rf.name}>
                          <td className="ck-label">{rf.label}</td>
                          <td className="ck-value">
                            {rf.type === "select" ? labelOf(rf, row[rf.name]) : String(row[rf.name] ?? "").trim() || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              </div>
            );
          })}
      </section>
    );
  });
}

// Same letterhead image the legacy app prints (ref/images/kop_kep.jpg).
function Kop({ code }) {
  return (
    <>
      <header className="ck-kop">
        <img src="/brand/kop-kep.jpg" alt="Kop Komite Etik Penelitian Universitas Padjadjaran" />
      </header>
      {code ? <div className="ck-code">{code}</div> : null}
    </>
  );
}

function Identitas({ etik, pembimbing = [], penelitiAsing = [] }) {
  const judul = etik.n_judul || "-";
  return (
    <>
      <h3 className="ck-title">{judul}</h3>
      <p className="ck-meta">
        Versi protokol {etik.ver_pro || "-"} | Kelompok {etik.c_jenis_subjek || "-"} | Diajukan{" "}
        {isoDay(etik.d_awal) || "-"}
      </p>

      <h4 className="ck-section-title">1. Informasi Umum Peneliti Utama</h4>
      <Rows
        rows={[
          ["Nama Peneliti Utama", etik.n_peneliti_u],
          ["Keahlian / Spesialisasi", etik.n_keahlian],
          ["Jabatan / Kedudukan", etik.n_kedudukan],
          ["No. HP & Telp Rumah", `HP: ${etik.n_hp || "-"} | Telp: ${etik.n_telp_rumah || "-"}`],
          ["Kontak Person (CP)", `Nama: ${etik.n_cp || "-"} | HP: ${etik.hp_cp || "-"} | Email: ${etik.n_email || "-"}`],
          [
            "Civitas UNPAD & Jenjang",
            `Civitas UNPAD: ${flag(etik.civitas_unpad)} | Jenjang: ${pick(JENJANG, etik.c_jenjang)} | Peruntukan: ${pick(PERUNTUKAN, etik.c_peruntukan)}`,
          ],
        ]}
      />

      <h4 className="ck-section-title">2. Instansi Pengusul &amp; Sponsor</h4>
      <Rows
        rows={[
          ["Asal Instansi Pengusul", etik.n_institusi_pengusul],
          ["Alamat Instansi", etik.n_alamat_pengusul],
          [
            "Kontak Instansi",
            `HP: ${etik.hp_pengusul || "-"} | Fax: ${etik.fax_pengusul || "-"} | Email: ${etik.n_email_pengusul || "-"}`,
          ],
          ["Sponsor / Sumber Dana", pick(SUMBER_DANA, etik.c_dana)],
          ["Detail Sponsor", etik.s_dana],
        ]}
      />

      {pembimbing.length ? (
        <>
          <h4 className="ck-section-title">Tim Pembimbing / Peneliti Lain</h4>
          <table className="ck-table">
            <thead>
              <tr>
                <th style={{ width: "6%" }}>No.</th>
                <th>Nama Lengkap &amp; Gelar</th>
              </tr>
            </thead>
            <tbody>
              {pembimbing.map((row, i) => (
                <tr key={i}>
                  <td className="ck-center">{i + 1}</td>
                  <td>{row.n_nama || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h4 className="ck-section-title">3. Informasi Umum Penelitian</h4>
      <Rows
        rows={[
          ["Judul Penelitian", etik.n_judul],
          ["Judul Payung", etik.n_judul_payung],
          ["Peneliti Payung / Peran", [etik.n_peneliti_payung, etik.n_peran].filter(Boolean).join(" / ")],
          ["Versi Protokol", etik.ver_pro],
          ["Bidang Ilmu", etik.bidang_ilmu],
          ["Ringkasan Penelitian", <span className="ck-pre">{etik.ringkasan_penelitian || "-"}</span>],
          ["Tujuan Penelitian", <span className="ck-pre">{etik.tujuan_penelitian || "-"}</span>],
          ["Jumlah Partisipan", <span className="ck-pre">{etik.jum_partisipan || "-"}</span>],
          ["Tempat Penelitian", <span className="ck-pre">{etik.n_tempat_penelitian || "-"}</span>],
          ["Tanggal Pelaksanaan", `${isoDay(etik.d_awal) || "-"} s.d. ${isoDay(etik.d_akhir) || "-"}`],
          ["Tanggal Rekrutmen", isoDay(etik.d_rekrutmen)],
        ]}
      />

      <h4 className="ck-section-title">4. Pelaksanaan, Kerjasama &amp; Etik Lain</h4>
      <Rows
        rows={[
          ["Penelitian Multisenter", flag(etik.c_multisenter)],
          ["Senter Utama", etik.c_spu],
          ["Senter Satelit", etik.c_sps],
          ["Status Kerjasama", pick(KERJASAMA, etik.c_kerjasama)],
          ["Jumlah Negara", etik.v_jum_negara],
          ["Peneliti / Institusi Asing", flag(etik.c_peneliti_asing_stat)],
          ["Pengajuan ke Komite Etik Lain", flag(etik.c_etik_lain)],
          ["Status Komite Etik Lain", pick(STATUS_ETIK_LAIN, etik.c_status_etik_lain)],
          ["Conflict of Interest", flag(etik.c_coi)],
          ["Uraian CoI", etik.u_coi],
          ["Rincian Dana", <span className="ck-pre">{etik.s_rincian_dana || "-"}</span>],
        ]}
      />
      {penelitiAsing.length ? (
        <table className="ck-table">
          <thead>
            <tr>
              <th>Nama &amp; Institusi</th>
              <th>Tugas &amp; Fungsi</th>
              <th>Kontak</th>
            </tr>
          </thead>
          <tbody>
            {penelitiAsing.map((row, i) => (
              <tr key={i}>
                <td>{row.n_nama_asing || "-"}</td>
                <td>{row.n_tugas_asing || "-"}</td>
                <td>{row.n_kontak_asing || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}

const FORM_TITLES = {
  "1": "FL_2.2.3 Formulir Etik Penelitian Non klinis",
  "2": "FL_2.2.2 Formulir Etik Penelitian Uji klinis",
  "3": "FL_2.2.6 Formulir Etik Penelitian Penggunaan dan Kesejahteraan Hewan",
  "4": "FL_2.2.5 Formulir Etik Penelitian Sosial Komunitas",
  "5": "FL_2.2.4 Formulir Penelitian BBT Riset dasar",
  "6": "FL_2.2.7 Formulir Etik Penelitian Penggunaan BBT hewan",
  "7": "FL_2.2.8 Formulir Etik Laporan Kasus_Serial Kasus Klinis",
};

function Pengesahan({ id, etik, pengesahan }) {
  return (
    <>
      <h4 className="ck-section-title">Pengesahan</h4>
      <table className="ck-table ck-sign">
        <thead>
          <tr>
            <th style={{ width: "6%" }}>No</th>
            <th style={{ width: "32%" }}>Jabatan / Peran</th>
            <th style={{ width: "32%" }}>Nama &amp; Gelar</th>
            <th style={{ width: "30%" }}>Tanda Tangan</th>
          </tr>
        </thead>
        <tbody>
          {pengesahan.length ? (
            pengesahan.map((row, i) => (
              <tr key={i}>
                <td className="ck-center">{i + 1}</td>
                <td>{row.c_peran || "-"}</td>
                <td>{row.n_nama || "-"}</td>
                <td className="ck-center ck-sign-cell">
                  {row.path_ttd ? (
                    <img src={`/api/pengajuan-baru/${id}/ttd/${i + 1}`} alt={`Tanda tangan ${row.n_nama}`} />
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="ck-center">
                Belum ada pengesah.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="ck-date">Tanggal pengajuan: {isoDay(etik.d_ttd) || "-"}</p>
    </>
  );
}

function EtikDoc({ data }) {
  const kelompok = data.item.kelompokKode;
  const mainKey = kelompok === "7" ? "bcd" : "b";
  const schema = sectionSchema(mainKey, kelompok, data.etik);
  const withPsp = kelompok !== "3" && kelompok !== "6" && kelompok !== "7";
  const c = withPsp ? sectionSchema("c", kelompok, data.etik) : null;
  const d = withPsp ? sectionSchema("d", kelompok, data.etik) : null;
  const e = sectionSchema("e", kelompok, data.etik);
  return (
    <>
      <Kop code={data.item.kelompokLabel || FORM_TITLES[kelompok]} />
      <Identitas etik={data.etik} pembimbing={data.pembimbing} penelitiAsing={data.penelitiAsing} />
      {schema ? <SectionBlocks schema={schema} data={data.sections[mainKey]} /> : null}
      {c ? <SectionBlocks schema={c} data={data.sections.c} /> : null}
      {d ? <SectionBlocks schema={d} data={data.sections.d} /> : null}
      {e ? <SectionBlocks schema={e} data={data.sections.e} /> : null}
      <Pengesahan id={data.item.id} etik={data.etik} pengesahan={data.pengesahan} />
    </>
  );
}

function BiodataDoc({ data }) {
  const versi = data.sections.li?.c_versi || data.etik.ver_pro || "-";
  const pages = [
    {
      nama: data.etik.n_peneliti_u,
      text: data.etik.biodata_pi,
      title: "BIODATA PENELITI UTAMA",
      empty: "- Biodata Peneliti Utama Belum Diisi -",
    },
  ];
  for (const row of data.pembimbing) {
    pages.push({
      nama: row.n_nama,
      text: row.biodata_lain,
      title: "BIODATA PEMBIMBING / PENELITI LAIN",
      empty: "- Biodata Belum Diisi -",
    });
  }
  if (!data.pembimbing.length) {
    pages.push({
      title: "BIODATA PEMBIMBING / PENELITI LAIN",
      empty: "- Tidak Ada Data Pembimbing / Peneliti Lain -",
      nama: null,
    });
  }
  return pages.map((page, i) => (
    <div key={i} className="ck-page">
      <Kop />
      <div className="ck-code">{page.title}</div>
      {page.nama !== null ? <p className="ck-section-title">NAMA : {page.nama || "-"}</p> : null}
      <div
        className="ck-rich"
        dangerouslySetInnerHTML={{
          __html: String(page.text ?? "").trim() || `<span style="color:#777; font-style:italic;">${page.empty}</span>`,
        }}
      />
      <p className="ck-meta ck-foot">Biodata Peneliti (Versi {versi})</p>
    </div>
  ));
}

function LiDoc({ data }) {
  const li = data.sections.li ?? {};
  const filled = (v) => String(v ?? "").trim().replace(/[.-]/g, "").trim() !== "";
  const or = (v, fallback) => (filled(v) ? v : fallback);
  const mitigasi = [
    ["Penanganan Medis/Psikososial", li.s_mitigasi_medis],
    ["Ganti Rugi / Kompensasi", li.s_mitigasi_ganti_rugi],
    ["Fasilitas Kesehatan Rujukan", li.s_mitigasi_faskes_rujuk],
    ["Penanggung Jawab Biaya", li.s_mitigasi_penanggung_jawab],
  ].filter(([, value]) => filled(value));
  const awal = [
    ["1. Tujuan Penelitian", li.s_tujuan_penelitian],
    ["2. Mengapa Anda Terpilih", li.s_alasan_terpilih],
    ["3. Tata Cara dan Prosedur Penelitian", li.s_prosedur],
    ["4. Risiko dan Ketidaknyamanan", li.s_risiko_ketidaknyamanan],
  ];
  return (
    <>
      <Kop code="FL/2.2.9 Lembar Informasi" />
      <h3 className="ck-title ck-center">LEMBAR INFORMASI BAGI CALON PARTISIPAN</h3>
      <p className="ck-judul ck-center" style={{ textTransform: "uppercase" }}>
        "{data.etik.n_judul || "JUDUL PENELITIAN"}"
      </p>
      <p className="ck-justify ck-indent">
        Saya adalah{" "}
        <strong>{or(li.n_peneliti_nama, data.etik.n_peneliti_u || "-")}</strong> berasal dari{" "}
        <strong>{or(li.n_peneliti_asal, data.etik.n_institusi_pengusul || "-")}</strong> yang sedang melakukan
        penelitian ini. Kami mengundang Anda untuk berpartisipasi dalam penelitian ini. Keikutsertaan Anda
        bersifat sepenuhnya sukarela, sehingga Anda berhak penuh untuk memutuskan berpartisipasi atau tidak.
      </p>
      {awal.map(([label, value]) => (
        <div key={label} className="ck-poin">
          <p className="ck-poin-title">{label}</p>
          <p className="ck-pre">{filled(value) ? value : "-"}</p>
        </div>
      ))}
      <div className="ck-poin">
        <p className="ck-poin-title">5. Manfaat Keikutsertaan</p>
        <p>
          • <strong>Manfaat Langsung:</strong>{" "}
          {filled(li.s_manfaat_langsung)
            ? li.s_manfaat_langsung
            : "Tidak ada manfaat langsung secara medis/klinis."}
        </p>
        <p>• <strong>Manfaat Umum:</strong> {filled(li.s_manfaat_umum) ? li.s_manfaat_umum : "-"}</p>
      </div>
      {filled(li.s_prosedur_alternatif) ? (
        <div className="ck-poin">
          <p className="ck-poin-title">6. Prosedur Alternatif</p>
          <p className="ck-pre">{li.s_prosedur_alternatif}</p>
        </div>
      ) : null}
      <div className="ck-poin">
        <p className="ck-poin-title">7. Kerahasiaan Data</p>
        <p className="ck-pre">
          {or(
            li.s_kerahasiaan_data,
            "Semua kerahasiaan identitas dan data partisipan akan dijaga ketat sesuai standar etika penelitian.",
          )}
        </p>
      </div>
      <div className="ck-poin">
        <p className="ck-poin-title">8. Kesukarelaan dan Pengunduran Diri</p>
        <p className="ck-pre">
          {or(
            li.s_kesukarelaan,
            "Keikutsertaan Anda bersifat sukarela. Anda berhak mengundurkan diri kapan saja tanpa sanksi atau kehilangan hak pelayanan Anda.",
          )}
        </p>
        {filled(li.s_kriteria_pengunduran) ? (
          <p>
            • <strong>Kriteria Pengunduran Diri:</strong> {li.s_kriteria_pengunduran}
          </p>
        ) : null}
      </div>
      {mitigasi.length ? (
        <div className="ck-poin">
          <p className="ck-poin-title">9. Penanganan dan Kompensasi</p>
          {mitigasi.map(([label, value]) => (
            <p key={label}>
              • <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>
      ) : null}
      <div className="ck-poin">
        <p className="ck-poin-title">10. Penanggung Jawab Penelitian</p>
        <p>
          • <strong>Penanggung Jawab Penelitian:</strong>{" "}
          {or(li.n_pj_penelitian_nama, data.etik.n_peneliti_u || "-")}
          {filled(li.n_pj_penelitian_hp) ? ` (No. HP: ${li.n_pj_penelitian_hp})` : ""}
        </p>
        {filled(li.n_pj_penelitian_alamat) ? (
          <p className="ck-sub">Alamat: {li.n_pj_penelitian_alamat}</p>
        ) : null}
        {filled(li.n_pj_medik_nama) ? (
          <>
            <p style={{ marginTop: 5 }}>
              • <strong>Penanggung Jawab Medis:</strong> {li.n_pj_medik_nama}
              {filled(li.n_pj_medik_hp) ? ` (No. HP: ${li.n_pj_medik_hp})` : ""}
            </p>
            {filled(li.n_pj_medik_alamat) ? (
              <p className="ck-sub">Alamat: {li.n_pj_medik_alamat}</p>
            ) : null}
          </>
        ) : null}
      </div>
      <div style={{ marginTop: 40, pageBreakInside: "avoid" }}>
        <table style={{ width: "100%", border: "none", fontSize: "12pt", lineHeight: 1.4 }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", border: "none", textAlign: "center", verticalAlign: "top" }}>
                <br />
                Peneliti Utama,
                <br />
                <br />
                <br />
                <br />
                <br />( <strong>{or(li.n_peneliti_nama, data.etik.n_peneliti_u || "-")}</strong> )
              </td>
              <td style={{ width: "50%", border: "none", textAlign: "center", verticalAlign: "top" }}>
                ......................, .................................... {new Date().getFullYear()}
                <br />
                Saksi / Perwakilan Partisipan,
                <br />
                <br />
                <br />
                <br />
                <br />( ............................................ )
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

const PSP_OPENER =
  "Saya telah membaca atau memperoleh penjelasan, sepenuhnya menyadari, mengerti, dan memahami tentang tujuan, manfaat, dan risiko yang mungkin timbul dalam penelitian, serta telah diberi kesempatan untuk bertanya dan telah dijawab dengan memuaskan, juga sewaktu-waktu dapat mengundurkan diri dari keikutsertaannya, maka saya setuju / tidak setuju *) ikut dalam penelitian ini, yang berjudul:";
const PSP_CLOSING =
  "Saya dengan sukarela memilih untuk ikut serta dalam penelitian ini tanpa tekanan/paksaan siapapun. Saya akan diberikan salinan lembar penjelasan dan formulir persetujuan yang telah saya tandatangani untuk arsip saya.";

const PSP_PAGES = [
  {
    sub: "UNTUK IKUT SERTA DALAM PENELITIAN DENGAN PARTISIPAN ANAK (ASSENT)",
    note: "(Usia \u2265 12 Tahun s.d. < 18 Tahun)",
    widths: ["60%", "20%", "20%"],
    parties: [
      ["Nama Peserta", "Umur", "Alamat"],
      ["Nama Orang Tua / Wali"],
    ],
  },
  {
    sub: "UNTUK IKUT SERTA DALAM PENELITIAN DENGAN PARTISIPAN ORANG DEWASA",
    note: "(Usia \u2265 18 Tahun)",
    widths: ["45%", "20%", "35%"],
    parties: [["Nama", "Umur", "Alamat"]],
  },
  {
    sub: "UNTUK IKUT SERTA DALAM PENELITIAN DENGAN KELOMPOK RENTAN (VULNERABLE)",
    widths: ["45%", "20%", "35%"],
    opener:
      "Saya/Wali telah membaca atau memperoleh penjelasan, sepenuhnya menyadari, mengerti, dan memahami tentang tujuan, manfaat, dan risiko yang mungkin timbul dalam penelitian, serta telah diberi kesempatan untuk bertanya dan telah dijawab dengan memuaskan, juga sewaktu-waktu dapat mengundurkan diri dari keikutsertaannya, maka saya setuju / tidak setuju *) ikut dalam penelitian ini, yang berjudul:",
    parties: [
      ["Nama Anak/Adik Saya", "Umur", "Alamat"],
      ["Nama Wali"],
    ],
  },
  {
    sub: "ORANG TUA / WALI UNTUK KEIKUTSERTAAN SUBJEK DALAM PENELITIAN",
    widths: ["45%", "20%", "35%"],
    opener:
      "Saya sebagai Orang Tua / Wali dari subjek penelitian telah membaca atau memperoleh penjelasan, sepenuhnya menyadari, mengerti, dan memahami tentang tujuan, manfaat, dan risiko yang mungkin timbul dalam penelitian, serta telah diberi kesempatan untuk bertanya dan telah dijawab dengan memuaskan, juga sewaktu-waktu dapat mengundurkan diri dari keikutsertaannya, maka saya setuju / tidak setuju *) memberikan izin untuk keikutsertaan dalam penelitian ini, yang berjudul:",
    closing:
      "Saya dengan sukarela memberikan persetujuan ini tanpa tekanan/paksaan siapapun. Saya akan diberikan salinan lembar penjelasan dan formulir persetujuan yang telah saya tandatangani untuk arsip saya.",
    parties: [
      ["Nama Anak/Adik Saya", "Umur", "Alamat"],
      ["Nama Orang Tua Wali", "Umur", "Alamat"],
    ],
  },
];

function PspDoc({ data }) {
  const judul = data.etik.n_judul || "-";
  const nama = data.etik.n_peneliti_u || "-";
  return PSP_PAGES.map((page, i) => (
    <div key={i} className="ck-page">
      <Kop />
      <div className="ck-banner">
        <p>PERNYATAAN PERSETUJUAN (PSP)</p>
        <p>{page.sub}</p>
        {page.note ? <p className="ck-sub">{page.note}</p> : null}
      </div>
      <p className="ck-justify">{page.opener || PSP_OPENER}</p>
      <p className="ck-judul ck-judulbox">"{judul}"</p>
      <p className="ck-justify">{page.closing || PSP_CLOSING}</p>
      <p>
        <strong>Saya setuju: Ya / Tidak *)</strong>
      </p>
      <table className="ck-table ck-sign">
        <thead>
          <tr>
            <th style={{ width: page.widths[0] }}>Identitas Para Pihak</th>
            <th style={{ width: page.widths[1] }}>Tanggal</th>
            <th style={{ width: page.widths[2] }}>
              Tanda Tangan
              <br />
              <span style={{ fontSize: "8.5pt", fontWeight: "normal" }}>
                (bila tidak bisa dapat digunakan cap jempol)
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {page.parties.map((party, j) => (
            <tr key={j}>
              <td>
                {party.map((line) => (
                  <span key={line}>
                    <strong>{line}:</strong>
                    <br />
                  </span>
                ))}
                <br />
              </td>
              <td style={{ verticalAlign: "top" }}>Tgl.:</td>
              <td className="ck-sign-cell" />
            </tr>
          ))}
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <strong>Nama Peneliti:</strong> {nama}
            </td>
            <td style={{ verticalAlign: "top" }}>Tgl.:</td>
            <td className="ck-sign-cell" />
          </tr>
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <strong>Nama Saksi:</strong>
            </td>
            <td style={{ verticalAlign: "top" }}>Tgl.:</td>
            <td className="ck-sign-cell" />
          </tr>
        </tbody>
      </table>
      <p className="ck-foot">*) Coret yang tidak perlu</p>
    </div>
  ));
}

function HelsinkiDoc({ data }) {
  const lines = [
    "Saya yang bertanda tangan di bawah ini:",
    `Nama Peneliti Utama        : ${data.etik.n_peneliti_u || "............................................................"}`,
    `Institusi/Program Studi   : ${data.etik.n_institusi_pengusul || "............................................................"}`,
    `Judul Penelitian          : ${data.etik.n_judul || "............................................................"}`,
    `Nomor Protokol            : ${data.etik.ver_pro || "............................................................"}`,
    "",
    "Dengan ini menyatakan bahwa:",
    "Penelitian ini akan dilakukan dengan mengutamakan keselamatan, martabat, dan hak partisipan penelitian, sesuai prinsip Deklarasi Helsinki (World Medical Association, 2013).",
    "Saya akan memastikan bahwa setiap partisipan penelitian memberikan persetujuan setelah penjelasan (informed consent) secara sukarela.",
    "Risiko penelitian telah dipertimbangkan secara cermat, dan hanya akan dilakukan jika manfaat potensial lebih besar daripada risiko.",
    "Partisipan penelitian yang tergolong kelompok rentan akan mendapatkan perlindungan khusus.",
    "Protokol penelitian ini telah/akan diajukan untuk mendapat persetujuan dari Komite Etik Penelitian yang independen.",
    "Hasil penelitian, baik positif maupun negatif, akan dipublikasikan secara jujur dan transparan.",
    "Seluruh proses penelitian akan dilakukan dengan menjunjung tinggi integritas ilmiah dan tanggung jawab profesional.",
    "",
    "Demikian pernyataan ini dibuat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.",
    "",
    "Bandung, ....................................... 20....",
    "",
    "Tanda tangan,",
    "",
    "",
    `[${data.etik.n_peneliti_u || "Nama Peneliti Utama"}]`,
  ];
  return (
    <>
      <Kop code="FL/2.1.1 Lembar Pernyataan Kepatuhan terhadap Deklarasi Helsinki" />
      <h3 className="ck-title ck-center">LEMBAR PERNYATAAN KEPATUHAN TERHADAP DEKLARASI HELSINKI</h3>
      <div className="ck-pre ck-statement">{lines.join("\n")}</div>
    </>
  );
}

const JENIS_TITLE = {
  etik: "Formulir Etik",
  biodata: "Biodata Peneliti",
  li: "Lembar Informasi",
  psp: "PSP",
  helsinki: "Deklarasi Helsinki",
};

export default function PengajuanBaruCetakPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const jenis = JENIS_TITLE[params.get("jenis")] ? params.get("jenis") : "etik";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getPengajuanPrint(id)
      .then((next) => alive && setData(next))
      .catch((err) => alive && setError(err.message ?? "Gagal memuat data cetak."));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Alert tone="error" title="Dokumen tidak dapat dibuka">
          {error}
        </Alert>
        <Link to="/app/pengajuan-baru" className="mt-4 inline-block text-brand underline">
          Kembali ke daftar pengajuan
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-[14px] text-ink-soft">Memuat dokumen…</div>;
  }

  return (
    <div className="ck-root">
      <style>{PRINT_CSS}</style>
      <div className="ck-toolbar">
        <Link to="/app/pengajuan-baru" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> Kembali
        </Link>
        <p className="text-[13.5px] font-semibold text-ink">
          {JENIS_TITLE[jenis]} - {data.item.judul || `Pengajuan #${data.item.id}`}
        </p>
        <Button type="button" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" aria-hidden="true" /> Cetak / Simpan PDF
        </Button>
      </div>

      <div className="ck-sheet">
        {jenis === "etik" ? <EtikDoc data={data} /> : null}
        {jenis === "biodata" ? <BiodataDoc data={data} /> : null}
        {jenis === "li" ? <LiDoc data={data} /> : null}
        {jenis === "psp" ? <PspDoc data={data} /> : null}
        {jenis === "helsinki" ? <HelsinkiDoc data={data} /> : null}
      </div>
    </div>
  );
}

const PRINT_CSS = `
.ck-root { background: #e9e9e9; min-height: 100vh; padding-bottom: 40px; }
.ck-toolbar { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #cfcfcf; padding: 10px 18px; }
.ck-sheet { font-family: "Times New Roman", Times, serif; color: #000; font-size: 11.5pt; line-height: 1.45; max-width: 210mm; margin: 18px auto; background: #fff; padding: 16mm 16mm 18mm; }
.ck-page + .ck-page { page-break-before: always; break-before: page; border-top: 1px dashed #bbb; margin-top: 18px; padding-top: 18px; }
.ck-kop { margin-bottom: 8px; }
.ck-kop img { width: 100%; height: auto; display: block; }
.ck-code { background: #eee; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 11pt; padding: 4px 8px; margin-bottom: 14px; }
.ck-title { text-align: center; font-size: 12.5pt; text-transform: uppercase; margin: 10px 0 2px; }
.ck-meta { text-align: center; font-size: 10pt; margin: 0 0 12px; }
.ck-east, .ck-center { text-align: center; }
.ck-section { margin-top: 14px; }
.ck-section-title { font-size: 11.5pt; color: #00008b; margin: 14px 0 6px; border-bottom: 1px solid #00008b; padding-bottom: 2px; }
.ck-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; }
.ck-table td, .ck-table th { border: 1px solid #555; padding: 4px 6px; vertical-align: top; }
.ck-table th { background: #eee; font-weight: bold; }
.ck-label { width: 32%; font-weight: 600; background: #f7f7f7; }
.ck-value { white-space: pre-line; }
.ck-center { text-align: center; }
.ck-pre { white-space: pre-line; }
.ck-repeat { margin: 6px 0 10px; }
.ck-repeat-title { font-weight: bold; margin: 6px 0 3px; }
.ck-justify { text-align: justify; }
.ck-indent { text-indent: 28px; }
.ck-judul { text-align: center; font-weight: bold; text-transform: uppercase; margin: 8px 0 12px; }
.ck-judulbox { border: 1px dashed #444; padding: 8px 12px; margin: 10px 0 15px; font-style: italic; }
.ck-poin { margin-bottom: 10px; }
.ck-poin-title { font-weight: bold; margin-bottom: 2px; }
.ck-sub { padding-left: 14px; font-size: 10.5pt; }
.ck-banner { background: #eee; border: 1px solid #000; padding: 8px 10px; text-align: center; font-weight: bold; margin: 8px 0 15px; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; text-transform: uppercase; }
.ck-banner p { margin: 0; }
.ck-banner .ck-sub { font-weight: normal; font-style: italic; }
.ck-sign-cell { height: 64px; text-align: center; vertical-align: bottom; }
.ck-sign-cell img { max-height: 58px; max-width: 160px; display: inline-block; }
.ck-sign td, .ck-sign th { font-size: 10.5pt; }
.ck-date { margin-top: 10px; font-size: 10.5pt; }
.ck-foot { margin-top: 8px; font-size: 9.5pt; font-style: italic; }
.ck-rich { text-align: justify; }
.ck-rich table { width: 100%; border-collapse: collapse; margin: 6px 0; }
.ck-rich th, .ck-rich td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
.ck-rich > table:first-child { table-layout: fixed; }
.ck-rich > table:first-child td { border: 0; padding: 3px 4px; }
.ck-rich > table:first-child td:nth-child(1) { width: 30%; }
.ck-rich > table:first-child td:nth-child(2) { width: 16px; }
.ck-rich > table:first-child td:nth-child(3) { width: auto; }
.ck-rich p { margin: 6px 0; }
.ck-statement { margin-top: 8px; font-size: 11.5pt; line-height: 1.6; }
@media print {
  body { background: #fff !important; }
  .ck-toolbar { display: none !important; }
  .ck-root { background: #fff; padding: 0; }
  .ck-sheet { margin: 0; max-width: none; padding: 0; }
  .ck-page + .ck-page { border-top: 0; margin-top: 0; padding-top: 0; }
  @page { size: A4 portrait; margin: 18mm 16mm 20mm; }
}
`;
