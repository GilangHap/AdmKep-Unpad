// Server calls for the pengajuan baru module. Mirrors authApi's error shape so views
// can surface `error.fields` next to the offending input.

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("Tidak dapat menghubungi server. Periksa koneksi Anda."), {
      reason: "network",
    });
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? "Terjadi kesalahan. Coba lagi."), {
      status: res.status,
      fields: data.fields,
    });
  }
  return data;
}

export async function listPengajuan() {
  const data = await request("/api/pengajuan-baru");
  return data.items ?? [];
}

export async function getPengajuan(id) {
  const data = await request(`/api/pengajuan-baru/${id}`);
  return data.item;
}

/** Creates a draft; resolves to the stored item so the caller can switch to it. */
export async function createPengajuan(values) {
  return request("/api/pengajuan-baru", { method: "POST", body: values });
}

/** Updates an existing unsent draft; resolves to the stored item. */
export async function updatePengajuan(id, values) {
  return request(`/api/pengajuan-baru/${id}`, { method: "PUT", body: values });
}

/** Uploads one attachment slot; the server sniffs the bytes and returns the stored name. */
export async function uploadPengajuanFile(id, slot, file) {
  let res;
  try {
    res = await fetch(`/api/pengajuan-baru/${id}/files/${slot}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/octet-stream" },
      body: file,
    });
  } catch {
    throw Object.assign(new Error("Tidak dapat mengunggah file. Periksa koneksi Anda."), {
      reason: "network",
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah file.");
  return data;
}

export async function deletePengajuan(id) {
  return request(`/api/pengajuan-baru/${id}`, { method: "DELETE" });
}

/** Finalises a draft: it leaves the draft state and enters the petugas queue. */
export async function submitPengajuan(id) {
  return request(`/api/pengajuan-baru/${id}/submit`, { method: "POST" });
}
