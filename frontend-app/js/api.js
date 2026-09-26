// Central place to point the app frontend at the backend API.
// Change this if you deploy the backend somewhere other than localhost:4000.
export const API_BASE = window.__API_BASE__ || "http://localhost:4000/api";

export function authToken() {
  return localStorage.getItem("asmoro_token");
}

export function currentUser() {
  const raw = localStorage.getItem("asmoro_user");
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem("asmoro_token", token);
  localStorage.setItem("asmoro_user", JSON.stringify(user));
}

export function updateStoredUser(patch) {
  const u = currentUser();
  if (!u) return;
  localStorage.setItem("asmoro_user", JSON.stringify({ ...u, ...patch }));
}

export function clearSession() {
  localStorage.removeItem("asmoro_token");
  localStorage.removeItem("asmoro_user");
}

export function isLoggedIn() {
  return !!authToken();
}

// Remembers where to come back to, then routes to #/login.
export function requireLoginOrRedirect() {
  if (!isLoggedIn()) {
    localStorage.setItem("asmoro_redirect_after_login", location.hash || "#/");
    location.hash = "#/login";
    return false;
  }
  return true;
}

export async function api(path, { method = "GET", body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth && authToken()) headers["Authorization"] = `Bearer ${authToken()}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data.error || "Terjadi kesalahan. Coba lagi.");
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function fileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE.replace(/\/api$/, "") + path;
}

// Resolves an "image" field that may be: a full URL, an /uploads/... path
// from the admin media library, or a legacy bare filename that lives in
// frontend-app/assets/ (kept for backward compatibility with seed data).
export function assetUrl(image, fallback) {
  if (!image) return fallback || "";
  if (image.startsWith("http") || image.startsWith("/uploads")) return fileUrl(image);
  return `assets/${image}`;
}

export function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatRupiah(n) {
  if (n === null || n === undefined) return "-";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export function stars(rating) {
  const r = Math.round(rating || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

export function statusLabel(status) {
  const map = {
    menunggu_pembayaran: ["Menunggu Pembayaran", "wait"],
    menunggu_verifikasi: ["Menunggu Verifikasi", "wait"],
    menunggu_kedatangan: ["Menunggu Kedatangan", "wait"],
    menunggu_konfirmasi_admin: ["Menunggu Konfirmasi", "wait"],
    dikonfirmasi: ["Dikonfirmasi", "ok"],
    diproses: ["Diproses", "ok"],
    dikirim: ["Dikirim", "ok"],
    selesai: ["Selesai", "ok"],
    ditolak: ["Ditolak", "bad"],
  };
  return map[status] || [status, "wait"];
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
