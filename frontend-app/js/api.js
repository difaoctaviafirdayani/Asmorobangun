// Central place to point the app frontend at the backend API.
// Change this if you deploy the backend somewhere other than localhost:4000.
const API_BASE = (window.__API_BASE__) || "http://localhost:4000/api";

function authToken() {
  return localStorage.getItem("asmoro_token");
}

function currentUser() {
  const raw = localStorage.getItem("asmoro_user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("asmoro_token", token);
  localStorage.setItem("asmoro_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("asmoro_token");
  localStorage.removeItem("asmoro_user");
}

function isLoggedIn() {
  return !!authToken();
}

// Redirects to login if not authenticated, remembering where to come back to.
// Use on pages/actions that require login (per revision: booking any facility requires login).
function requireLoginOrRedirect() {
  if (!isLoggedIn()) {
    localStorage.setItem("asmoro_redirect_after_login", window.location.pathname + window.location.search);
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function api(path, { method = "GET", body, auth = false, isForm = false } = {}) {
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
    throw new Error(data.error || "Terjadi kesalahan. Coba lagi.");
  }
  return data;
}

function fileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE.replace(/\/api$/, "") + path;
}

function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2400);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatRupiah(n) {
  if (n === null || n === undefined) return "-";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function stars(rating) {
  const r = Math.round(rating || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function statusLabel(status) {
  const map = {
    menunggu_pembayaran: ["Menunggu Pembayaran", "wait"],
    menunggu_verifikasi: ["Menunggu Verifikasi", "wait"],
    menunggu_kedatangan: ["Menunggu Kedatangan", "wait"],
    menunggu_konfirmasi_admin: ["Menunggu Konfirmasi", "wait"],
    dikonfirmasi: ["Dikonfirmasi", "ok"],
    selesai: ["Selesai", "ok"],
    ditolak: ["Ditolak", "bad"],
  };
  return map[status] || [status, "wait"];
}
