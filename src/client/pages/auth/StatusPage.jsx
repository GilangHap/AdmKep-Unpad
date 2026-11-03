import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, Select } from "@/components/ui/FormControl";
import { ROUTES } from "@/config/site";
import { statusSchema } from "@/lib/authSchemas";
import { searchApprovals } from "@/lib/authApi";

const initial = { status: "idle", message: null, results: [], query: null };

export default function StatusPage() {
  const [state, setState] = useState(initial);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(statusSchema),
    defaultValues: { category: "JUDUL", query: "" },
  });

  const onSubmit = async (values) => {
    setState({ ...initial, status: "loading" });
    try {
      const response = await searchApprovals(values);
      setState({
        status: response.total === 0 ? "empty" : "results",
        message: null,
        results: response.results,
        query: values,
      });
    } catch (error) {
      setState({ ...initial, status: "error", message: error.message });
    }
  };

  return (
    <AuthShell
      title="Cek status pengajuan etik"
      subtitle="Telusuri data etik berdasarkan nama peneliti, kode pengajuan, atau judul penelitian."
      footer={
        <p className="text-[16px] text-ink-soft">
          Belum mengajukan?{" "}
          <Link to={ROUTES.register} className="font-semibold text-gold-deep hover:underline">
            Daftar akun
          </Link>{" "}
          atau{" "}
          <Link to={ROUTES.login} className="font-semibold text-gold-deep hover:underline">
            masuk
          </Link>
          .
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          <Field label="Cari berdasarkan" htmlFor="status-category" error={errors.category?.message}>
            {({ describedBy }) => (
              <Select
                id="status-category"
                invalid={Boolean(errors.category)}
                aria-describedby={describedBy}
                {...register("category")}
              >
                <option value="JUDUL">Judul</option>
                <option value="PENELITI">Peneliti</option>
                <option value="KODE">Kode</option>
              </Select>
            )}
          </Field>

          <Field label="Kata kunci" htmlFor="status-query" required error={errors.query?.message}>
            {({ describedBy }) => (
              <Input
                id="status-query"
                type="search"
                placeholder="Masukkan kata kunci…"
                invalid={Boolean(errors.query)}
                aria-describedby={describedBy}
                {...register("query")}
              />
            )}
          </Field>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          <Search className="size-4" aria-hidden="true" />
          Cari data
        </Button>
      </form>

      <div className="mt-5">
        {state.status === "idle" ? (
          <div className="rounded-xl bg-canvas p-4">
            <p className="text-[15px] leading-[1.55] text-ink">
              Hasil tampil di sini. Gunakan minimal 3 karakter, lalu cocokkan
              nomor etik dengan dokumen komite.
            </p>
          </div>
        ) : null}

        {state.status === "loading" ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-canvas" />
            ))}
          </div>
        ) : null}

        {state.status === "error" ? <Alert tone="error">{state.message}</Alert> : null}

        {state.status === "empty" ? (
          <div className="rounded-xl bg-canvas px-4 py-6 text-center">
            <p className="text-[14px] font-semibold text-ink">Data tidak ditemukan</p>
            <p className="mx-auto mt-1 max-w-[36ch] text-[15px] leading-[1.55] text-ink-soft">
              Tidak ada hasil untuk “{state.query?.query}”. Periksa ejaan atau
              gunakan kategori lain.
            </p>
          </div>
        ) : null}

        {state.status === "results" ? (
          <div className="overflow-hidden rounded-xl bg-canvas">
            <table className="w-full border-collapse text-left text-[13px]" data-ui>
              <thead>
                <tr className="text-[13px] text-ink-faint">
                  <th scope="col" className="py-2.5 pl-4 pr-2 font-medium">Judul</th>
                  <th scope="col" className="px-2 py-2.5 font-medium">Peneliti</th>
                  <th scope="col" className="px-2 py-2.5 font-medium">Status</th>
                  <th scope="col" className="py-2.5 pl-2 pr-4 font-medium">No etik</th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((row) => (
                  <tr key={row.id} className="border-t border-line" /* taste-skill-ignore: real table row rule */>
                    <td className="py-3 pl-4 pr-2 text-ink">{row.title}</td>
                    <td className="px-2 py-3 text-ink">{row.researcher}</td>
                    <td className="px-2 py-3 text-ink-soft">{row.status}</td>
                    <td className="num py-3 pl-2 pr-4 text-gold-deep">{row.ethicsNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
