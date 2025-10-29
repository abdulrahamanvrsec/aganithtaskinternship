const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(payload?.error || payload || "Request failed");
  }
  return payload;
}

export async function registerUser(form) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });
  return handleResponse(res);
}

export async function verifyAccount(token) {
  const res = await fetch(`${API_BASE}/api/verify?token=${encodeURIComponent(token)}`);
  return handleResponse(res);
}

export async function login(credentials) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
}

export async function adminLogin(credentials) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateProfile(token, data) {
  const res = await fetch(`${API_BASE}/api/me`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function createShareLink(token, expiresIn) {
  const res = await fetch(`${API_BASE}/api/me/share-links`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ expiresIn }),
  });
  return handleResponse(res);
}

export async function listShareLinks(token) {
  const res = await fetch(`${API_BASE}/api/me/share-links`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchShareProfile(token, viewer) {
  const url = new URL(`${API_BASE}/share/${token}`);
  if (viewer) {
    url.searchParams.set("viewer", viewer);
  }
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchShareResume(token) {
  const res = await fetch(`${API_BASE}/share/${token}/resume`);
  if (!res.ok) {
    throw new Error("Unable to download resume");
  }
  const blob = await res.blob();
  return blob;
}

export async function fetchAdminStats(token) {
  const res = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchAdminUsers(token) {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchAdminUserDetail(token, id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function adminUpdateUser(token, id, data) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function adminToggleBlock(token, id, action) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export { API_BASE };
