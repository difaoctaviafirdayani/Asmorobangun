import { icon } from "../icons.js";
import { api, assetUrl, escapeHtml } from "../api.js";

async function render(container) {
  container.innerHTML = `
    <div class="page-head">
      <button class="icon-btn" data-nav="#/" aria-label="Kembali">${icon("back")}</button>
      <h2>Fasilitas Kami</h2>
      <button class="icon-btn" data-open-search aria-label="Cari">${icon("search")}</button>
    </div>
    <div class="fac-list" id="facList"><div class="empty-state">Memuat...</div></div>
  `;
  try {
    const { facilities } = await api("/facilities");
    document.getElementById("facList").innerHTML = facilities
      .map(
        (f) => `<a class="fac-card" href="#/facilities/${f.id}">
          <img src="${assetUrl(f.image, "assets/sanggar-tari.jpg")}" onerror="this.onerror=null;this.src='assets/sanggar-tari.jpg'" alt="" />
          <div class="fac-body">
            <div class="fac-top">
              <div class="fac-title">${escapeHtml(f.name)}</div>
              ${f.avgRating ? `<div class="fac-rate">${icon("star")} ${f.avgRating}</div>` : ""}
            </div>
            <div class="fac-desc">${escapeHtml(f.shortDesc)}</div>
          </div>
        </a>`
      )
      .join("");
  } catch (e) {
    document.getElementById("facList").innerHTML = `<div class="empty-state">Gagal memuat fasilitas.</div>`;
  }
}

export default { nav: "facilities", render };
