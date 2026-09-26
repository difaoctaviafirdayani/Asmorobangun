import { api, assetUrl, escapeHtml, formatDate } from "../api.js";

async function render(container, { id }) {
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/announcements">←</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  try {
    const { announcement: a } = await api(`/announcements/${id}`);
    document.getElementById("content").innerHTML = `
      ${a.image ? `<img class="news-detail-hero" src="${assetUrl(a.image)}" onerror="this.style.display='none'"/>` : ""}
      <div style="margin-top:14px">
        <span class="tag">${escapeHtml(a.type)}</span>
        <h2 style="margin-top:10px">${escapeHtml(a.title)}</h2>
        <div style="font-size:0.78rem;color:var(--ink-soft);margin-bottom:14px">${formatDate(a.date)}</div>
        <p style="white-space:pre-line">${escapeHtml(a.body)}</p>
      </div>`;
  } catch (err) {
    document.getElementById("content").innerHTML = `<div class="empty-state">Pengumuman tidak ditemukan.</div>`;
  }
}

export default { nav: "", render };
