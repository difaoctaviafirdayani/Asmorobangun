import { api, isLoggedIn, currentUser, clearSession, updateStoredUser, showToast, escapeHtml, fileUrl, waLink, ADMIN_WA } from "../api.js";
import { icon } from "../icons.js";

const AVATAR_SIZE = 512; // foto dikecilkan & dipotong persegi 512x512 sebelum diunggah
const MAX_PICK_MB = 15;   // batas foto asli yang boleh dipilih (akan dikecilkan otomatis)

async function render(container) {
  container.innerHTML = `
    <div class="topbar"><div class="topbar-row"><div class="wordmark" style="font-size:1.05rem">Akun Saya</div></div></div>
    <div class="section" id="profileWrap">Memuat...</div>
  `;
  paint();
  syncFromServer();
}

// Ambil data terbaru dari server (mis. user yang login sebelum fitur foto ada)
async function syncFromServer() {
  if (!isLoggedIn()) return;
  try {
    const { user } = await api("/auth/me", { auth: true });
    const before = currentUser();
    if (before && before.avatar !== user.avatar) {
      updateStoredUser({ avatar: user.avatar || null });
      paint();
    }
  } catch (err) {
    // diam saja; tampilan tetap pakai data lokal
  }
}

function avatarHtml(u) {
  const inner = u.avatar
    ? `<img src="${escapeHtml(fileUrl(u.avatar))}" alt="Foto profil ${escapeHtml(u.name)}" />`
    : `<span>${escapeHtml(u.name.charAt(0).toUpperCase())}</span>`;
  return `
    <div class="avatar-wrap">
      <div class="avatar-circle" id="avatarCircle">${inner}</div>
      <button type="button" class="avatar-edit" id="avatarEditBtn" aria-label="Ganti foto profil">${icon("camera")}</button>
      <input type="file" id="avatarInput" accept="image/jpeg,image/png,image/webp" hidden />
    </div>`;
}

function paint() {
  const wrap = document.getElementById("profileWrap");
  if (!wrap) return;
  if (!isLoggedIn()) {
    wrap.innerHTML = `<div class="card card-pad" style="text-align:center">
      <p>Kamu belum masuk.</p>
      <a class="btn btn-primary" href="#/login">Masuk</a>
      <a class="btn btn-outline" style="margin-top:10px;display:block" href="#/register">Daftar Akun</a>
    </div>`;
    return;
  }
  const u = currentUser();
  wrap.innerHTML = `
    <div class="card card-pad" style="text-align:center;margin-bottom:16px">
      ${avatarHtml(u)}
      <h3 style="margin-top:12px">${escapeHtml(u.name)}</h3>
      <div style="font-size:0.8rem;color:var(--ink-soft)">${escapeHtml(u.email)}</div>
      <div class="avatar-actions">
        <button type="button" class="btn btn-ghost btn-sm" id="avatarChangeBtn">${icon("camera")} ${u.avatar ? "Ganti Foto" : "Tambah Foto"}</button>
        ${u.avatar ? `<button type="button" class="btn btn-danger btn-sm" id="avatarRemoveBtn">${icon("trash")} Hapus</button>` : ""}
      </div>
      <div class="field-hint" style="margin-top:8px">JPG, PNG, atau WEBP. Foto otomatis dipotong persegi.</div>
    </div>
    <div class="menu-list" style="padding:0">
      <a class="menu-row" href="#/my-orders"><div class="m-icon">${icon("receipt")}</div><div class="m-body"><div class="m-title">Pesanan &amp; Pendaftaran Saya</div></div></a>
      <a class="menu-row" href="${waLink()}" target="_blank" rel="noopener"><div class="m-icon">${icon("whatsapp")}</div><div class="m-body"><div class="m-title">Hubungi Admin (WhatsApp)</div><div class="m-sub">+${ADMIN_WA}</div></div></a>
    </div>
    <button class="btn btn-outline" style="margin-top:18px" id="logoutBtn">Keluar</button>
  `;

  const input = document.getElementById("avatarInput");
  const openPicker = () => input.click();
  document.getElementById("avatarEditBtn").addEventListener("click", openPicker);
  document.getElementById("avatarChangeBtn").addEventListener("click", openPicker);
  input.addEventListener("change", onPickFile);

  const removeBtn = document.getElementById("avatarRemoveBtn");
  if (removeBtn) removeBtn.addEventListener("click", onRemoveAvatar);

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    paint();
    showToast("Berhasil keluar.");
  });
}

function setBusy(busy) {
  const circle = document.getElementById("avatarCircle");
  if (circle) circle.classList.toggle("is-loading", busy);
  ["avatarEditBtn", "avatarChangeBtn", "avatarRemoveBtn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = busy;
  });
}

// Potong tengah jadi persegi lalu kecilkan -> Blob JPEG
function resizeToSquare(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const target = Math.min(size, side);
      const canvas = document.createElement("canvas");
      canvas.width = target;
      canvas.height = target;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // isi latar putih untuk PNG/WEBP transparan
      ctx.fillRect(0, 0, target, target);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memproses foto."))),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File tidak bisa dibaca sebagai gambar."));
    };
    img.src = url;
  });
}

async function onPickFile(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = ""; // supaya bisa pilih file yang sama lagi
  if (!file) return;

  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    return showToast("Pilih foto berformat JPG, PNG, atau WEBP.");
  }
  if (file.size > MAX_PICK_MB * 1024 * 1024) {
    return showToast(`Ukuran foto terlalu besar (maks ${MAX_PICK_MB}MB).`);
  }

  setBusy(true);
  try {
    const blob = await resizeToSquare(file, AVATAR_SIZE);
    const form = new FormData();
    form.append("avatar", blob, "avatar.jpg");
    const data = await api("/auth/me/avatar", { method: "POST", body: form, auth: true, isForm: true });
    updateStoredUser({ avatar: data.user.avatar });
    showToast("Foto profil diperbarui.");
    paint();
  } catch (err) {
    showToast(err.message || "Gagal mengunggah foto.");
    setBusy(false);
  }
}

async function onRemoveAvatar() {
  if (!confirm("Hapus foto profil?")) return;
  setBusy(true);
  try {
    await api("/auth/me/avatar", { method: "DELETE", auth: true });
    updateStoredUser({ avatar: null });
    showToast("Foto profil dihapus.");
    paint();
  } catch (err) {
    showToast(err.message || "Gagal menghapus foto.");
    setBusy(false);
  }
}

export default { nav: "profile", render };