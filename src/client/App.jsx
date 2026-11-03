import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import StatusPage from "@/pages/auth/StatusPage";
import ActivatePage from "@/pages/auth/ActivatePage";
import PortalPage from "@/pages/auth/PortalPage";
import DashboardPage from "@/pages/app/DashboardPage";
import ModulePage from "@/pages/app/ModulePage";
import PengajuanBaruListPage from "@/pages/app/PengajuanBaruListPage";
import PengajuanBaruFormPage from "@/pages/app/PengajuanBaruFormPage";
import { AuthProvider, RequireAuth } from "@/lib/AuthProvider";

const MODULES = [
  {
    path: "biodata",
    title: "Biodata peneliti",
    description:
      "Data pribadi, kontak, institusi, riwayat pendidikan, dan riwayat penelitian Anda.",
  },

  {
    path: "pengajuan-perbaikan",
    title: "Pengajuan perbaikan",
    description:
      "Kirim kembali protokol yang sudah diperbaiki sesuai catatan telaah komite.",
  },
  {
    path: "pengajuan-amandemen",
    title: "Pengajuan amandemen",
    description:
      "Ajukan perubahan pada protokol yang sudah disetujui beserta surat pengantarnya.",
  },
  {
    path: "laporan-akhir",
    title: "Laporan akhir",
    description:
      "Laporkan hasil penelitian setelah kegiatan selesai, termasuk tanda terima.",
  },
  {
    path: "perpanjangan",
    title: "Perpanjangan",
    description:
      "Ajukan perpanjangan masa berlaku persetujuan etik sebelum kedaluwarsa.",
  },
  {
    path: "ktd-sae",
    title: "KTD-SAE",
    description:
      "Laporkan kejadian tidak diinginkan serius selama penelitian berlangsung.",
  },
];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/registrasi-akun" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrasi" element={<RegisterPage />} />
        <Route path="/lupa-password" element={<ForgotPasswordPage />} />
        <Route path="/cek-status" element={<StatusPage />} />
        <Route path="/aktivasi/:token?" element={<ActivatePage />} />
        <Route path="/registrasi-akun" element={<PortalPage />} />

        <Route path="/app" element={<Navigate to="/app/dasbor" replace />} />
        <Route path="/app/dasbor" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/app/pengajuan-baru" element={<RequireAuth><PengajuanBaruListPage /></RequireAuth>} />
        <Route path="/app/pengajuan-baru/baru" element={<RequireAuth><PengajuanBaruFormPage /></RequireAuth>} />
        {MODULES.map((m) => (
          <Route
            key={m.path}
            path={`/app/${m.path}`}
            element={<RequireAuth><ModulePage title={m.title} description={m.description} /></RequireAuth>}
          />
        ))}
        <Route
          path="/app/pengaturan"
          element={
            <RequireAuth>
              <ModulePage
                title="Pengaturan akun"
                description="Ubah kata sandi, email contact person, dan preferensi notifikasi."
              />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/registrasi-akun" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}