export const API_BASE = window.__API_BASE__ || "http://localhost:4000/api";

export function authToken() {
  return localStorage.getItem("asmoro_admin_token");
}
export function currentAdmin() {
  const raw = localStorage.getItem("asmoro_admin_user");
  return raw ? JSON.parse(raw) : null;
}
export function setAdminSession(token, user) {
  localStorage.setItem("asmoro_admin_token", token);
  localStorage.setItem("asmoro_admin_user", JSON.stringify(user));
}
export function clearAdminSession() {
  localStorage.removeItem("asmoro_admin_token");
  localStorage.removeItem("asmoro_admin_user");
}
export function isAdminLoggedIn() {
  return !!authToken() && !!currentAdmin();
}

export async function api(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (authToken()) headers["Authorization"] = `Bearer ${authToken()}`;

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
  if (res.status === 401 || res.status === 403) {
    if (data.needsPhoneVerification === undefined) {
      // Session expired / not an admin - bounce to login, but let normal 403s
      // from business logic (e.g. status transition rules) surface as errors.
    }
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

export function assetUrl(image, fallback) {
  if (!image) return fallback || "";
  if (image.startsWith("http") || image.startsWith("/uploads")) return fileUrl(image);
  return `../frontend-app/assets/${image}`;
}

export function showToast(msg) {
  let el = document.querySelector(".a-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "a-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
export function formatRupiah(n) {
  if (n === null || n === undefined) return "-";
  return "Rp " + Number(n).toLocaleString("id-ID");
}
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
