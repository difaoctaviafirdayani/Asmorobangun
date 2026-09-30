import { api, API_BASE, currentAdmin, formatDate, escapeHtml } from "../api.js";

// Foto sanggar diambil dari folder frontend-app/assets lewat backend (/app/assets/...),
// jadi tidak perlu menyalin file gambar ke folder admin.
const HERO_URL = API_BASE.replace(/\/api$/, "") + "/app/assets/sanggar-tari.jpg";

function todayLabel() {
  return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function heroHtml() {
  const admin = currentAdmin();
  const name = admin && admin.name ? admin.name : "Admin";
  return `
    <section class="a-hero">
      <img class="a-hero-img" src="${HERO_URL}" alt="Sanggar Asmorobangun" onerror="this.style.display='none'" />
      <div class="a-hero-shade"></div>
      <div class="a-hero-text">
        <h2>Sugeng Rawuh, ${escapeHtml(name)}!</h2>
        <div class="a-hero-sub">Statistik aktivitas pengguna bulan ini</div>
        <div class="a-hero-date">${todayLabel()}</div>
      </div>
    </section>`;
}

async function render(el) {
  el.innerHTML = `${heroHtml()}
    <div class="a-grid-stats" id="stats">Memuat...</div>
    <div class="a-card a-card-pad">
      <h3 style="font-size:1rem">Pendaftar Terbaru</h3>
      <div class="a-table-wrap"><table class="a-table" id="recentTable"><tbody><tr><td>Memuat...</td></tr></tbody></table></div>
    </div>`;
  const data = await api("/admin/stats");
  document.getElementById("stats").innerHTML = `
    <div class="a-stat"><div class="n">${data.totalPendaftar}</div><div class="l">Total Pendaftar/Pesanan</div></div>
    <div class="a-stat"><div class="n">${data.bookingsThisMonth + data.ordersThisMonth}</div><div class="l">Bulan Ini</div></div>
    <div class="a-stat"><div class="n">${data.pendingReview}</div><div class="l">Menunggu Verifikasi</div></div>
    <div class="a-stat"><div class="n" style="font-size:1rem">${escapeHtml(data.popularFacility)}</div><div class="l">Layanan Terpopuler</div></div>`;

  document.getElementById("recentTable").innerHTML = `
    <thead><tr><th>Nama</th><th>Layanan</th><th>Tanggal</th><th>Status</th></tr></thead>
    <tbody>${
      data.recentRegistrants.length
        ? data.recentRegistrants
            .map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.facility)}</td><td>${formatDate(r.date)}</td><td><span class="a-badge wait">${escapeHtml(r.status)}</span></td></tr>`)
            .join("")
        : `<tr><td colspan="4" class="a-empty">Belum ada data.</td></tr>`
    }</tbody>`;
}

export default { render };