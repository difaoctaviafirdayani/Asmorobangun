import { api, formatRupiah, assetUrl, escapeHtml } from "../api.js";
import { mountTopengAI } from "../topeng-ai.js";

async function render(container) {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="icon-btn" data-nav="#/">←</button>
        <div class="wordmark" style="font-size:1.05rem">Toko Topeng Malangan</div>
      </div>
    </div>
    <div class="section">
      <p style="font-size:0.85rem;color:var(--ink-soft)">Setiap topeng diukir tangan oleh pengrajin sanggar. Bisa request nama &amp; desain custom saat memesan. Ada pertanyaan soal topeng? Tanya Asisten Topeng di pojok kanan bawah 🎭</p>
    </div>
    <div class="tile-grid" id="grid"><div class="empty-state">Memuat...</div></div>
  `;
  try {
    const { topeng } = await api("/topeng");
    document.getElementById("grid").innerHTML = topeng
      .map(
        (t) => `<a class="tile" style="padding:0;overflow:hidden" href="#/topeng/${t.id}">
          <img src="${assetUrl(t.image)}" onerror="this.src='https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=400'" style="width:100%;height:120px;object-fit:cover"/>
          <div style="padding:10px">
            <div class="t-title">${escapeHtml(t.name)}</div>
            <div class="t-sub">${escapeHtml(t.character)}</div>
            <div style="font-weight:700;color:var(--wood-800);margin-top:4px;font-size:0.85rem">${formatRupiah(t.price)}</div>
          </div>
        </a>`
      )
      .join("");
  } catch (e) {}
  mountTopengAI();
}

export default { nav: "topeng", isTopeng: true, render };
