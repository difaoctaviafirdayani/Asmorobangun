import { api, stars, escapeHtml } from "../api.js";
import { topbar } from "../chrome.js";

const ICONS = { "panggilan-tari": "🎪", "kunjungan-edukasi": "🏫", "les-tari-wisata": "🎫", "les-tari-reguler": "💃", "les-karawitan": "🥁", "sewa-kostum": "👘" };

async function render(container) {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="icon-btn" data-nav="#/">←</button>
        <div class="wordmark" style="font-size:1.05rem">Fasilitas Kami</div>
        <button class="icon-btn" data-open-search>🔍</button>
      </div>
    </div>
    <div class="section">
      <p style="font-size:0.85rem;color:var(--ink-soft)">Dari kelas tari sekali coba sampai booking pentas untuk acara Anda — pilih layanan sanggar di bawah ini.</p>
    </div>
    <div class="tile-grid" id="tileGrid"><div class="empty-state">Memuat...</div></div>
  `;
  try {
    const { facilities } = await api("/facilities");
    document.getElementById("tileGrid").innerHTML = facilities
      .map(
        (f) => `<a class="tile" href="#/facilities/${f.id}">
          <div class="t-icon">${ICONS[f.id] || "🎭"}</div>
          <div class="t-title">${escapeHtml(f.name)}</div>
          <div class="t-sub">${escapeHtml(f.priceInfo.split("—")[0].split(".")[0])}</div>
          ${f.avgRating ? `<div class="stars" style="font-size:0.7rem">${stars(f.avgRating)} (${f.reviewCount})</div>` : ""}
        </a>`
      )
      .join("");
  } catch (e) {}
}

export default { nav: "facilities", render };
