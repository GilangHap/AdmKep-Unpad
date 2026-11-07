import nodemailer from "nodemailer";

const {
  SMTP_HOST = "127.0.0.1",
  SMTP_PORT = "1025",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE = "false",
  MAIL_FROM = "E-KEP Unpad <no-reply@kep.unpad.ac.id>",
  APP_BASE_URL = "http://localhost:3000",
} = process.env;

// MailHog (dev) needs no auth; real SMTP just adds the credentials in .env.
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // MailHog has no TLS; harmless for a real server that supports STARTTLS.
  ignoreTLS: true,
});

/**
 * The token rides in the path, not the query string.
 * nodemailer 10.3.1 on Windows rewrites "=" inside a quoted-printable body, which turned
 * "?token=ABC" into "?token=3DABC" and broke every activation link silently. A path segment
 * has no "=" and survives the encoder untouched (verified against MailHog).
 */
export const activationUrl = (token) =>
  `${APP_BASE_URL.replace(/\/$/, "")}/aktivasi/${encodeURIComponent(token)}`;

export async function sendActivationEmail({ to, name, token, expiresAt }) {
  const url = activationUrl(token);
  const hours = Math.round((expiresAt - Date.now()) / 36e5);

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Aktivasi akun E-KEP Unpad",
    text: [
      `Halo ${name},`,
      "",
      "Terima kasih telah mendaftar di E-Komisi Etik Penelitian Universitas Padjadjaran.",
      "Klik tautan berikut untuk mengaktifkan akun Anda:",
      "",
      url,
      "",
      `Tautan berlaku ${hours} jam dan hanya dapat dipakai sekali.`,
      "Jika Anda tidak merasa mendaftar, abaikan email ini.",
      "",
      "- Komite Etik Penelitian Universitas Padjadjaran",
    ].join("\n"),
    html: activationHtml({ name, url, hours }),
  });

  return url;
}

export async function sendPasswordResetEmail({ to, name, password }) {
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Kata sandi baru akun E-KEP Unpad",
    text: [
      `Halo ${name},`,
      "",
      "Permintaan pengaturan ulang kata sandi Anda telah kami proses.",
      `Kata sandi baru: ${password}`,
      "",
      "Masuk lalu segera ganti kata sandi ini. Jika Anda tidak meminta perubahan,",
      "hubungi kep@unpad.ac.id.",
      "",
      "- Komite Etik Penelitian Universitas Padjadjaran",
    ].join("\n"),
    html: resetHtml({ name, password }),
  });
}

function resetHtml({ name, password }) {
  return `<!doctype html>
<html lang="id"><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="height:6px;background:#f8b500"></td></tr>
    <tr><td style="padding:32px">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">E-Komisi Etik Penelitian</p>
      <p style="margin:0 0 24px;font-size:15px;font-weight:700;color:#0f172a">Universitas Padjadjaran</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#0f172a">Kata sandi baru Anda</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569">Halo ${escapeHtml(name)}, permintaan pengaturan ulang kata sandi telah kami proses. Gunakan kata sandi berikut untuk masuk.</p>
      <p style="margin:0 0 20px;font-size:20px;font-weight:700;letter-spacing:1px;color:#002a5c;background:#f8fafc;border-radius:10px;padding:14px 18px;word-break:break-all">${escapeHtml(password)}</p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b">Segera ganti kata sandi ini setelah masuk. Jika Anda tidak meminta perubahan, hubungi kep@unpad.ac.id.</p>
    </td></tr>
  </table>
</body></html>`;
}

function activationHtml({ name, url, hours }) {
  return `<!doctype html>
<html lang="id"><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="height:6px;background:#f8b500"></td></tr>
    <tr><td style="padding:32px">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">E-Komisi Etik Penelitian</p>
      <p style="margin:0 0 24px;font-size:15px;font-weight:700;color:#0f172a">Universitas Padjadjaran</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#0f172a">Aktifkan akun Anda</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569">Halo ${escapeHtml(name)}, terima kasih telah mendaftar. Klik tombol di bawah untuk mengaktifkan akun pengajuan kaji etik Anda.</p>
      <p style="margin:0 0 24px">
        <a href="${url}" style="display:inline-block;background:#f8b500;color:#002a5c;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px">Aktifkan akun</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b">Tautan berlaku ${hours} jam dan hanya dapat dipakai sekali. Jika tombol tidak berfungsi, salin alamat ini:</p>
      <p style="margin:0 0 24px;font-size:12px;line-height:1.6;word-break:break-all;color:#003d7a">${url}</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Anda menerima email ini karena alamat ini didaftarkan di admkep.unpad.ac.id. Jika bukan Anda, abaikan saja.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

export async function verifyTransport() {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
