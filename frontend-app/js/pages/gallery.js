import { api, assetUrl, escapeHtml, formatDate } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-row">
        <button class="icon-btn" data-nav="#/">←</button>
        <div class="wordmark" style="font-size:1.05rem">Galeri Sanggar</div>
      </div>
    </div>
    <div class="section">
      <p style="font-size:0.85rem;color:var(--ink-soft)">Dokumentasi kegiatan &amp; pentas sanggar — terbuka untuk siapa saja, tidak perlu masuk akun.</p>
    </div>
    <div class="gallery-grid" id="grid"><div class="empty-state">Memuat...</div></div>

    <div class="lightbox" id="lightbox">
      <button class="lb-close" id="lbClose">✕</button>
      <img id="lbImg" />
      <div class="lb-cap" id="lbCap"></div>
    </div>
  `;

  let items = [];
  try {
    const { gallery } = await api("/gallery");
    items = gallery;
    document.getElementById("grid").innerHTML = items.length
      ? items
          .map(
            (g, i) => `<div class="g-item" data-idx="${i}">
              <img src="${assetUrl(g.image, "assets/st.jpg")}" onerror="this.src='assets/st.jpg'"/>
              <div class="g-cap">${escapeHtml(g.title)}</div>
            </div>`
          )
          .join("")
      : `<div class="empty-state"><div class="e-icon">🖼️</div>Belum ada foto galeri.</div>`;
  } catch (e) {
    document.getElementById("grid").innerHTML = `<div class="empty-state">Gagal memuat galeri.</div>`;
  }

  const lightbox = document.getElementById("lightbox");
  document.getElementById("lbClose").addEventListener("click", () => lightbox.classList.remove("open"));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("open");
  });
  document.querySelectorAll("[data-idx]").forEach((el) => {
    el.addEventListener("click", () => {
      const g = items[Number(el.getAttribute("data-idx"))];
      document.getElementById("lbImg").src = assetUrl(g.image, "assets/st.jpg");
      document.getElementById("lbCap").innerHTML = `<strong>${escapeHtml(g.title)}</strong><br/>${escapeHtml(g.caption || "")}<br/><span style="opacity:0.7">${formatDate(g.date)}</span>`;
      lightbox.classList.add("open");
    });
  });
}

export default { nav: "", render };
