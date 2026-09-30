import { icon } from "../icons.js";
import { api, assetUrl, escapeHtml, formatDate } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="page-head">
      <button class="icon-btn" data-nav="#/" aria-label="Kembali">${icon("back")}</button>
      <h2>Galeri Sanggar</h2>
    </div>
    <div class="gallery-grid g-cards" id="grid"><div class="empty-state">Memuat...</div></div>

    <div class="lightbox" id="lightbox">
      <button class="lb-close" id="lbClose" aria-label="Tutup">${icon("close")}</button>
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
            (g, i) => `<div class="g-card" data-idx="${i}">
              <img src="${assetUrl(g.image, "assets/st.jpg")}" onerror="this.src='assets/st.jpg'"/>
              <div class="g-title">${escapeHtml(g.title)}</div>
              ${g.caption ? `<div class="g-text">${escapeHtml(g.caption)}</div>` : ""}
            </div>`
          )
          .join("")
      : `<div class="empty-state"><div class="e-icon">${icon("gallery")}</div>Belum ada foto galeri.</div>`;
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
