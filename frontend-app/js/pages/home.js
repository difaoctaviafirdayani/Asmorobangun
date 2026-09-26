import { api, assetUrl, escapeHtml, formatDateShort } from "../api.js";
import { topbar } from "../chrome.js";

const FACILITY_ICONS = { "panggilan-tari": "🎪", "kunjungan-edukasi": "🏫", "les-tari-wisata": "🎫", "les-tari-reguler": "💃", "les-karawitan": "🥁", "sewa-kostum": "👘" };

async function render(container) {
  container.innerHTML = `
    ${topbar({ search: "bar", cart: true })}

    <div class="section" style="padding-top:14px;padding-bottom:4px">
      <div class="card" style="overflow:hidden">
        <img src="assets/sanggar-utama.jpg" onerror="this.style.display='none'" style="width:100%;height:170px;object-fit:cover;display:block" />
      </div>
    </div>

    <div class="section" style="padding-top:8px">
      <div class="section-head"><h3>Berita &amp; pengumuman</h3><a class="see-all" href="#/announcements">Lihat semua</a></div>
    </div>
    <div class="news-row" id="newsRow"><div class="empty-state" style="width:100%">Memuat...</div></div>

    <div class="section" style="padding-top:6px">
      <div class="section-head"><h3>Berita &amp; artikel terbaru</h3><a class="see-all" href="#/articles">Lihat semua</a></div>
    </div>
    <div class="section" style="padding-top:0" id="featuredArticleWrap"></div>

    <div class="section">
      <div class="section-head"><h3>Layanan sanggar</h3><a class="see-all" href="#/facilities">Lihat semua</a></div>
    </div>
    <div class="menu-list" id="menuList"></div>

    <div class="section">
      <div class="section-head"><h3>Galeri sanggar</h3><a class="see-all" href="#/gallery">Lihat semua</a></div>
    </div>
    <div class="hcards" id="galleryRow"><div class="empty-state" style="width:100%">Memuat...</div></div>

    <div class="section" id="lokasi">
      <div class="section-head"><h3>Lokasi sanggar</h3></div>
      <div class="card card-pad">
        <p style="margin-bottom:12px"><strong>Sanggar Asmorobangun</strong><br/>Dusun Kedungmonggo, Desa Karangpandan, Kec. Pakisaji, Kab. Malang, Jawa Timur.</p>
        <iframe class="map-embed" loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=112.5850%2C-8.0800%2C112.6250%2C-8.0500&layer=mapnik&marker=-8.0656%2C112.6040"></iframe>
        <div style="display:flex;gap:8px;margin-top:12px">
          <a class="btn btn-outline btn-sm" style="flex:1" href="https://www.google.com/maps/search/Sanggar+Asmorobangun+Pakisaji+Malang" target="_blank">Buka di Google Maps</a>
          <a class="btn btn-primary btn-sm" style="flex:1" href="https://wa.me/6281234567890" target="_blank">💬 WhatsApp Admin</a>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3>Forum diskusi</h3><a class="see-all" href="#/forum">Buka forum</a></div>
      <div class="card card-pad" style="text-align:center">
        <p>Punya pertanyaan atau mau berbagi pengalaman soal sanggar? Gabung diskusi warga &amp; alumni kelas di sini.</p>
        <a class="btn btn-primary" href="#/forum">💬 Masuk ke Forum</a>
      </div>
    </div>
  `;

  try {
    const { announcements } = await api("/announcements");
    const row = document.getElementById("newsRow");
    row.innerHTML = announcements.length
      ? announcements
          .slice(0, 8)
          .map(
            (a) => `<a class="news-card" href="#/announcements/${a.id}">
              <img class="nc-img" src="${assetUrl(a.image, "assets/sanggar-tari.jpg")}" onerror="this.style.display='none'" />
              <div class="nc-body">
                <span class="nc-type">${escapeHtml(a.type)}</span>
                <div class="nc-title">${escapeHtml(a.title)}</div>
                <div class="nc-date">${formatDateShort(a.date)}</div>
              </div>
            </a>`
          )
          .join("")
      : `<div class="empty-state" style="width:100%">Belum ada pengumuman.</div>`;
  } catch (e) {}

  try {
    const data = await api("/articles?limit=1");
    if (data.featured) {
      const a = data.featured;
      document.getElementById("featuredArticleWrap").innerHTML = `
        <a class="card" href="#/articles/${a.slug}" style="display:block">
          <img class="thumb" style="height:155px" src="${assetUrl(a.image)}" onerror="this.style.display='none'"/>
          <div class="card-pad">
            <span class="tag gold">${escapeHtml(a.category)}</span>
            <h4 style="margin-top:8px">${escapeHtml(a.title)}</h4>
            <p style="font-size:0.85rem;color:var(--ink-soft)">${escapeHtml(a.excerpt)}</p>
          </div>
        </a>`;
    }
  } catch (e) {}

  try {
    const data = await api("/facilities");
    document.getElementById("menuList").innerHTML = data.facilities
      .map(
        (f) => `<a class="menu-row" href="#/facilities/${f.id}">
          <div class="m-icon">${FACILITY_ICONS[f.id] || "🎭"}</div>
          <div class="m-body">
            <div class="m-title">${escapeHtml(f.name)}</div>
            <div class="m-sub">${escapeHtml(f.shortDesc)}</div>
          </div>
          <div class="m-meta">${f.avgRating ? "⭐ " + f.avgRating : ""}</div>
        </a>`
      )
      .join("");
  } catch (e) {}

  // Gallery: public, no login, shows EVERYTHING, horizontally scrollable.
  try {
    const { gallery } = await api("/gallery");
    const row = document.getElementById("galleryRow");
    row.innerHTML = gallery.length
      ? gallery
          .map(
            (g) => `<div class="hcard card" data-gallery-item="${g.id}">
              <img class="thumb" src="${assetUrl(g.image, "assets/st.jpg")}" onerror="this.src='assets/st.jpg'"/>
              <div class="hc-cap"><div class="hc-title">${escapeHtml(g.title)}</div>${g.caption ? escapeHtml(g.caption).slice(0, 60) : ""}</div>
            </div>`
          )
          .join("")
      : `<div class="empty-state" style="width:100%">Belum ada foto galeri.</div>`;
    row.querySelectorAll("[data-gallery-item]").forEach((el) => {
      el.addEventListener("click", () => (location.hash = "#/gallery"));
    });
  } catch (e) {}
}

export default { nav: "home", render };
