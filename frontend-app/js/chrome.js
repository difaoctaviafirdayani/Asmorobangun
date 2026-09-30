import { api, isLoggedIn } from "./api.js";
import { icon } from "./icons.js";

const NAV_ITEMS = [
  { id: "home", href: "#/", icon: "home", label: "Beranda" },
  { id: "facilities", href: "#/facilities", icon: "facilities", label: "Fasilitas" },
  { id: "forum", href: "#/forum", icon: "forum", label: "Forum" },
  { id: "topeng", href: "#/topeng", icon: "topeng", label: "Topeng" },
  { id: "profile", href: "#/profile", icon: "profile", label: "Akun" },
];

const QUICK_FEATURES = [
  { icon: "article", label: "Artikel & Berita", href: "#/articles" },
  { icon: "announce", label: "Pengumuman", href: "#/announcements" },
  { icon: "gallery", label: "Galeri Sanggar", href: "#/gallery" },
  { icon: "facilities", label: "Semua Fasilitas", href: "#/facilities" },
  { icon: "forum", label: "Forum Diskusi", href: "#/forum" },
  { icon: "receipt", label: "Pesanan Saya", href: "#/my-orders" },
];

let chromeBuilt = false;

export function ensureChrome() {
  if (chromeBuilt) return;
  chromeBuilt = true;

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.id = "bottomNav";
  document.querySelector(".app-shell").appendChild(nav);

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.id = "searchOverlay";
  overlay.innerHTML = `
    <div class="search-panel">
      <div class="close-row"><button class="icon-btn" style="background:var(--cream-300);color:var(--wood-900)" id="closeSearchBtn" aria-label="Tutup">${icon("close")}</button></div>
      <div class="field">
        <input id="globalSearchInput" placeholder="Cari artikel, kelas, topeng, forum..." style="border:1.5px solid var(--line);border-radius:999px;padding:12px 16px;width:100%;font-size:0.92rem" />
      </div>
      <div id="globalSearchResults"></div>
      <div id="quickFeaturesWrap">
        <div class="section-head"><h3 style="font-size:0.95rem">Jelajahi fitur</h3></div>
        <div class="quick-grid">
          ${QUICK_FEATURES.map((f) => `<a href="${f.href}"><div class="qi">${icon(f.icon)}</div>${f.label}</a>`).join("")}
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("closeSearchBtn").addEventListener("click", closeSearch);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
  });

  let searchDebounce;
  document.getElementById("globalSearchInput").addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    const q = e.target.value.trim();
    const wrap = document.getElementById("quickFeaturesWrap");
    const results = document.getElementById("globalSearchResults");
    if (!q) {
      wrap.style.display = "block";
      results.innerHTML = "";
      return;
    }
    wrap.style.display = "none";
    searchDebounce = setTimeout(async () => {
      try {
        const data = await api(`/search?q=${encodeURIComponent(q)}`);
        const all = [
          ...data.articles.map((x) => ({ ...x, url: `#/articles/${x.slug}` })),
          ...data.facilities.map((x) => ({ ...x, url: `#/facilities/${x.id}` })),
          ...data.topeng.map((x) => ({ ...x, url: `#/topeng/${x.id}` })),
          ...data.forum.map((x) => ({ ...x, url: `#/forum/${x.id}` })),
        ];
        results.innerHTML = all.length
          ? `<div class="search-results">${all
              .map((x) => `<a href="${x.url}" class="search-result-item" data-close-search><span>${x.title}</span><span class="tag">${x.type}</span></a>`)
              .join("")}</div>`
          : `<div class="empty-state"><div class="e-icon">${icon("search")}</div>Tidak ada hasil untuk "${q}"</div>`;
      } catch (err) {
        results.innerHTML = "";
      }
    }, 350);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-search]") || e.target.closest("#quickFeaturesWrap a")) closeSearch();
  });
}

export function openSearch() {
  document.getElementById("searchOverlay").classList.add("open");
  setTimeout(() => document.getElementById("globalSearchInput").focus(), 50);
}
export function closeSearch() {
  document.getElementById("searchOverlay").classList.remove("open");
}
window.openSearch = openSearch;
window.closeSearch = closeSearch;

export function renderBottomNav(active) {
  ensureChrome();
  const nav = document.getElementById("bottomNav");
  nav.innerHTML = NAV_ITEMS.map(
    (item) => `<a href="${item.href}" class="${item.id === active ? "active" : ""}">
        <span class="nav-icon">${icon(item.icon)}</span>${item.label}
      </a>`
  ).join("");
}

// Renders the shared topbar markup used by most pages.
export function topbar({ title, back, search, cart, brand } = {}) {
  ensureChrome();
  if (back) {
    return `<div class="back-row"><button class="back-btn" data-nav="${back}" aria-label="Kembali">${icon("back")}</button>${title ? `<h3 style="margin:0">${title}</h3>` : ""}</div>`;
  }
  // ← UBAH: judul jadi gambar logo, posisinya di tengah (tombol pesanan tetap di kanan)
  return `
    <div class="topbar">
      <div class="topbar-row topbar-center">
        <img class="brand-logo" src="assets/logo-gold.png" alt="asmorobangun" />
        ${cart ? `<a class="icon-btn" href="#/my-orders" aria-label="Pesanan saya">${icon("receipt")}</a>` : ""}
      </div>
      ${search === "bar" ? `<div class="search-bar" data-open-search>${icon("search")}<input readonly placeholder="Cari artikel, kelas, topeng, forum..." /></div>` : ""}
    </div>`;
}

// Delegate a couple of common data-attributes so page templates stay plain HTML strings.
document.addEventListener("click", (e) => {
  const searchTrigger = e.target.closest("[data-open-search]");
  if (searchTrigger) return openSearch();
  const navTrigger = e.target.closest("[data-nav]");
  if (navTrigger) {
    location.hash = navTrigger.getAttribute("data-nav");
  }
});