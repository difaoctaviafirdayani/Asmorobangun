import { api, assetUrl, escapeHtml, formatDate } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="icon-btn" data-nav="#/">←</button>
        <div class="wordmark" style="font-size:1.05rem">Berita &amp; Pengumuman</div>
      </div>
    </div>
    <div class="section">
      <p style="font-size:0.85rem;color:var(--ink-soft)">Kabar terbaru seputar pendaftaran, jadwal, dan kegiatan Sanggar Asmorobangun.</p>
    </div>
    <div class="section" id="list"><div class="empty-state">Memuat...</div></div>
  `;
  try {
    const { announcements } = await api("/announcements");
    document.getElementById("list").innerHTML = announcements.length
      ? announcements
          .map(
            (a) => `<a class="news-list-item" href="#/announcements/${a.id}">
              <img class="nc-img" src="${assetUrl(a.image, "assets/sanggar-tari.jpg")}" onerror="this.style.display='none'"/>
              <div style="flex:1;min-width:0">
                <span class="nc-type">${escapeHtml(a.type)}</span>
                <div class="nc-title" style="margin:5px 0 4px">${escapeHtml(a.title)}</div>
                <div style="font-size:0.8rem;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(a.body)}</div>
                <div class="nc-date" style="margin-top:4px">${formatDate(a.date)}</div>
              </div>
            </a>`
          )
          .join("")
      : `<div class="empty-state"><div class="e-icon">📢</div>Belum ada pengumuman.</div>`;
  } catch (e) {}
}

export default { nav: "", render };
