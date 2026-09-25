const API_BASE = (window.__API_BASE__) || "http://localhost:4000/api";

function authToken() { return localStorage.getItem("asmoro_admin_token"); }
function currentAdmin() {
  const raw = localStorage.getItem("asmoro_admin_user");
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem("asmoro_admin_token", token);
  localStorage.setItem("asmoro_admin_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("asmoro_admin_token");
  localStorage.removeItem("asmoro_admin_user");
}
function requireAdminLogin() {
  const user = currentAdmin();
  if (!authToken() || !user || user.role !== "admin") {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function api(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (authToken()) headers["Authorization"] = `Bearer ${authToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
  return data;
}

function fileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE.replace(/\/api$/, "") + path;
}

function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}
function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatRupiah(n) {
  if (n === null || n === undefined) return "-";
  return "Rp " + Number(n).toLocaleString("id-ID");
}
function statusLabel(status) {
  const map = {
    menunggu_pembayaran: ["Menunggu Bayar", "wait"],
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
