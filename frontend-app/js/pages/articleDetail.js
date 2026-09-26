import { api, assetUrl, escapeHtml, formatDate } from "../api.js";

async function render(container, { slug }) {
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/articles">←</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  try {
    const { article: a } = await api(`/articles/${slug}`);
    document.getElementById("content").innerHTML = `
      <img class="detail-hero" style="border-radius:16px" src="${assetUrl(a.image)}" onerror="this.src='https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=700'"/>
      <div style="margin-top:14px">
        <span class="tag">${escapeHtml(a.category)}</span>
        <h2 style="margin-top:10px">${escapeHtml(a.title)}</h2>
        <div style="font-size:0.78rem;color:var(--ink-soft);margin-bottom:14px">Oleh ${escapeHtml(a.author)} · ${formatDate(a.date)}</div>
        ${a.content.split("\n\n").map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>`;
  } catch (err) {
    document.getElementById("content").innerHTML = `<div class="empty-state">Artikel tidak ditemukan.</div>`;
  }
}

export default { nav: "", render };
