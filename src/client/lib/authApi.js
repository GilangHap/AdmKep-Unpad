// Talks to the Express API in src/server. Errors surface as thrown Error with a
// `fields` map when the API rejected a specific input.

async function request(path, { method = "GET", body, credentials = "same-origin" } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("Tidak dapat menghubungi server. Periksa koneksi Anda."), {
      reason: "network",
    });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? "Terjadi kesalahan. Coba lagi."), {
      status: res.status,
      reason: data.reason,
      fields: data.fields,
      email: data.email,
    });
  }

  return data;
}

export async function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: {
      email: payload.email,
      name: payload.name,
      gender: payload.gender,
      phone: payload.phone,
      institution: payload.institution,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    },
  });
}

export async function activateAccount(token) {
  return request("/api/auth/activate", { method: "POST", body: { token } });
}

export async function resendActivation(email) {
  return request("/api/auth/resend-activation", { method: "POST", body: { email } });
}

export async function getActivationStatus(email) {
  return request(`/api/auth/activation-status?email=${encodeURIComponent(email)}`);
}

export async function login({ email, password, remember }) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password, remember: Boolean(remember) },
  });
}

/** Current session (httpOnly cookie), or a 401 the caller turns into a redirect. */
export async function me() {
  return request("/api/auth/me", { credentials: "include" });
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    /* the client clears its own state regardless */
  }
}

export async function requestPasswordReset(payload) {
  return request("/api/auth/request-password-reset", {
    method: "POST",
    body: {
      email: payload.email,
      phone: payload.phone,
      institution: payload.institution,
      reason: payload.reason,
      group: payload.group,
    },
  });
}

export async function searchApprovals({ category, query }) {
  return request(
    `/api/status/search?category=${encodeURIComponent(category)}&query=${encodeURIComponent(query)}`,
  );
}
