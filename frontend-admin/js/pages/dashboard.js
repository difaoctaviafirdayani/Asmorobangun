import { api, formatDate, escapeHtml } from "../api.js";

async function render(el) {
  el.innerHTML = `<div class="a-grid-stats" id="stats">Memuat...</div>
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
