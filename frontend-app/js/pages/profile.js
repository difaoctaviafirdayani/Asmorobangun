import { isLoggedIn, currentUser, clearSession, showToast, escapeHtml } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="topbar"><div class="topbar-row"><div class="wordmark" style="font-size:1.05rem">Akun Saya</div></div></div>
    <div class="section" id="profileWrap">Memuat...</div>
  `;
  paint();
}

function paint() {
  const wrap = document.getElementById("profileWrap");
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
      <div style="width:66px;height:66px;border-radius:50%;background:var(--wood-800);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 10px">${escapeHtml(u.name.charAt(0).toUpperCase())}</div>
      <h3>${escapeHtml(u.name)}</h3>
      <div style="font-size:0.8rem;color:var(--ink-soft)">${escapeHtml(u.email)}</div>
      ${u.phoneVerified ? `<div class="status-chip ok" style="margin-top:8px">📱 HP terverifikasi</div>` : ""}
    </div>
    <div class="menu-list" style="padding:0">
      <a class="menu-row" href="#/my-orders"><div class="m-icon">🧾</div><div class="m-body"><div class="m-title">Pesanan &amp; Pendaftaran Saya</div></div></a>
      <a class="menu-row" href="#/forum"><div class="m-icon">💬</div><div class="m-body"><div class="m-title">Diskusi Saya</div></div></a>
      <a class="menu-row" href="#/gallery"><div class="m-icon">🖼️</div><div class="m-body"><div class="m-title">Galeri Sanggar</div></div></a>
      <a class="menu-row" href="#/" data-scroll-lokasi><div class="m-icon">📍</div><div class="m-body"><div class="m-title">Lokasi Sanggar</div></div></a>
      <a class="menu-row" href="https://wa.me/6281234567890" target="_blank"><div class="m-icon">💬</div><div class="m-body"><div class="m-title">Hubungi Admin (WhatsApp)</div></div></a>
    </div>
    <button class="btn btn-outline" style="margin-top:18px" id="logoutBtn">Keluar</button>
  `;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    paint();
    showToast("Berhasil keluar.");
  });
}

export default { nav: "profile", render };
