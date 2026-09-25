// Injects the bottom navigation bar, the search overlay (triggered from the
// topbar), and the floating AI assistant sheet. Call renderChrome('home') etc.
// at the bottom of each page with the id of the currently active nav item.

const NAV_ITEMS = [
  { id: "home", href: "index.html", icon: "🏠", label: "Beranda" },
  { id: "facilities", href: "facilities.html", icon: "🎭", label: "Fasilitas" },
  { id: "forum", href: "forum.html", icon: "💬", label: "Forum" },
  { id: "topeng", href: "topeng.html", icon: "🛍️", label: "Topeng" },
  { id: "profile", href: "profile.html", icon: "👤", label: "Akun" },
];

const QUICK_FEATURES = [
  { icon: "📰", label: "Artikel & Berita", href: "articles.html" },
  { icon: "🎭", label: "Semua Fasilitas", href: "facilities.html" },
  { icon: "💃", label: "Kelas Tari", href: "facility-detail.html?id=les-tari-reguler" },
  { icon: "🥁", label: "Karawitan", href: "facility-detail.html?id=les-karawitan" },
  { icon: "🎫", label: "Kelas Wisata", href: "facility-detail.html?id=les-tari-wisata" },
  { icon: "🎪", label: "Panggilan Pentas", href: "facility-detail.html?id=panggilan-tari" },
  { icon: "🏫", label: "Kunjungan Edukasi", href: "facility-detail.html?id=kunjungan-edukasi" },
  { icon: "👘", label: "Sewa Kostum", href: "facility-detail.html?id=sewa-kostum" },
  { icon: "🪆", label: "Beli Topeng", href: "topeng.html" },
  { icon: "💬", label: "Forum Diskusi", href: "forum.html" },
  { icon: "📍", label: "Lokasi Sanggar", href: "index.html#lokasi" },
  { icon: "🧾", label: "Pesanan Saya", href: "my-orders.html" },
];

function renderChrome(active) {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;

  // Bottom nav
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.innerHTML = NAV_ITEMS.map(
    (item) => `<a href="${item.href}" class="${item.id === active ? "active" : ""}">
        <span class="nav-icon">${item.icon}</span>${item.label}
      </a>`
  ).join("");
  shell.appendChild(nav);

  // Search overlay
  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.id = "searchOverlay";
  overlay.innerHTML = `
    <div class="search-panel">
      <div class="close-row"><button class="icon-btn" style="background:var(--cream-300);color:var(--wood-900)" onclick="closeSearch()">✕</button></div>
      <div class="field">
        <input id="globalSearchInput" placeholder="Cari artikel, kelas, topeng, forum..." style="border:1.5px solid var(--line);border-radius:999px;padding:12px 16px;width:100%;font-size:0.92rem" />
      </div>
      <div id="globalSearchResults"></div>
      <div id="quickFeaturesWrap">
        <div class="section-head"><h3 style="font-size:0.95rem">Jelajahi fitur</h3></div>
        <div class="quick-grid">
          ${QUICK_FEATURES.map((f) => `<a href="${f.href}"><div class="qi">${f.icon}</div>${f.label}</a>`).join("")}
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // AI assistant FAB + sheet
  const fab = document.createElement("button");
  fab.className = "ai-fab";
  fab.innerHTML = "🤖";
  fab.title = "Tanya Asisten Asmorobangun";
  fab.onclick = openAI;
  shell.appendChild(fab);

  const aiPanel = document.createElement("div");
  aiPanel.className = "ai-panel";
  aiPanel.id = "aiPanel";
  aiPanel.innerHTML = `
    <div class="ai-sheet">
      <div class="ai-sheet-head">
        <div style="font-size:1.3rem">🤖</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:0.92rem">Asisten Asmorobangun</div>
          <div style="font-size:0.7rem;opacity:0.75">Tanya soal kelas, harga, lokasi, & pemesanan</div>
        </div>
        <button class="icon-btn" onclick="closeAI()">✕</button>
      </div>
      <div class="ai-sheet-body" id="aiMessages">
        <div class="chat-bubble admin">Halo! Aku asisten virtual sanggar. Mau tanya soal kelas tari, karawitan, sewa kostum, topeng, atau lokasi?</div>
      </div>
      <div class="ai-sheet-foot">
        <input id="aiInput" placeholder="Tulis pertanyaan..." style="flex:1;border:1.5px solid var(--line);border-radius:999px;padding:10px 14px" onkeydown="if(event.key==='Enter')sendAI()"/>
        <button class="btn btn-primary btn-sm" onclick="sendAI()">Kirim</button>
      </div>
    </div>`;
  document.body.appendChild(aiPanel);
}

function openSearch() {
  document.getElementById("searchOverlay").classList.add("open");
  setTimeout(() => document.getElementById("globalSearchInput").focus(), 50);
}
function closeSearch() {
  document.getElementById("searchOverlay").classList.remove("open");
}

let searchDebounce;
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "globalSearchInput") {
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
          ...data.articles.map((x) => ({ ...x, url: `article-detail.html?slug=${x.slug}` })),
          ...data.facilities.map((x) => ({ ...x, url: `facility-detail.html?id=${x.id}` })),
          ...data.topeng.map((x) => ({ ...x, url: `topeng-detail.html?id=${x.id}` })),
          ...data.forum.map((x) => ({ ...x, url: `forum-thread.html?id=${x.id}` })),
        ];
        results.innerHTML = all.length
          ? `<div class="search-results">${all
              .map(
                (x) => `<a href="${x.url}" class="search-result-item"><span>${x.title}</span><span class="tag search-result-item .badge-type">${x.type}</span></a>`
              )
              .join("")}</div>`
          : `<div class="empty-state"><div class="e-icon">🔍</div>Tidak ada hasil untuk "${q}"</div>`;
      } catch (err) {
        results.innerHTML = "";
      }
    }, 350);
  }
});

function openAI() { document.getElementById("aiPanel").classList.add("open"); }
function closeAI() { document.getElementById("aiPanel").classList.remove("open"); }

async function sendAI() {
  const input = document.getElementById("aiInput");
  const msg = input.value.trim();
  if (!msg) return;
  const box = document.getElementById("aiMessages");
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble buyer">${escapeHtml(msg)}</div>`);
  input.value = "";
  box.scrollTop = box.scrollHeight;
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble admin" id="aiTyping">Mengetik...</div>`);
  box.scrollTop = box.scrollHeight;
  try {
    const data = await api("/ai/chat", { method: "POST", body: { message: msg } });
    document.getElementById("aiTyping").outerHTML = `<div class="chat-bubble admin">${escapeHtml(data.reply)}</div>`;
  } catch (err) {
    document.getElementById("aiTyping").outerHTML = `<div class="chat-bubble admin">Maaf, asisten sedang gangguan. Coba lagi ya.</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
