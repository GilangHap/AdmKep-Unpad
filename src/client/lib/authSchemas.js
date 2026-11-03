import { z } from "zod";

const indonesianPhone = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi")
    .min(6, "Kata sandi minimal 6 karakter"),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid")
      .max(50, "Email maksimal 50 karakter"),
    name: z
      .string()
      .min(1, "Nama peneliti wajib diisi")
      .max(50, "Nama maksimal 50 karakter"),
    gender: z.enum(["L", "P"], {
      errorMap: () => ({ message: "Jenis kelamin wajib dipilih" }),
    }),
    phone: z
      .string()
      .min(1, "Nomor kontak wajib diisi")
      .regex(indonesianPhone, "Nomor kontak tidak valid (contoh: 08123456789)")
      .max(20, "Nomor kontak maksimal 20 karakter"),
    institution: z
      .string()
      .min(1, "Nama instansi wajib diisi")
      .max(100, "Nama instansi maksimal 100 karakter"),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .max(30, "Kata sandi maksimal 30 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
    agree: z.literal(true, {
      errorMap: () => ({
        message: "Anda harus menyetujui pernyataan sebelum mendaftar",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak sama",
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  phone: z
    .string()
    .min(1, "Nomor HP wajib diisi")
    .regex(indonesianPhone, "Nomor HP tidak valid (contoh: 08123456789)"),
  institution: z.string().min(1, "Asal instansi wajib diisi"),
  reason: z.string().min(1, "Alasan wajib diisi"),
  group: z.enum(["PEMOHON", "REVIEWER"], {
    errorMap: () => ({ message: "Kelompok pengguna wajib dipilih" }),
  }),
});

export const statusSchema = z.object({
  category: z.enum(["PENELITI", "KODE", "JUDUL"], {
    errorMap: () => ({ message: "Pilih kategori pencarian" }),
  }),
  query: z.string().min(3, "Minimal 3 karakter untuk mencari"),
});
