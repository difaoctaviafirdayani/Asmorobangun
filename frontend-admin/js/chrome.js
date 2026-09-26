import { currentAdmin, clearAdminSession } from "./api.js";

const MENU = [
  { id: "dashboard", href: "#/dashboard", icon: "📊", label: "Dashboard" },
  { id: "pendaftar", href: "#/pendaftar", icon: "🧾", label: "Pendaftar & Booking" },
  { id: "topeng-orders", href: "#/pesanan-topeng", icon: "🪆", label: "Pesanan Topeng" },
  { id: "kelas", href: "#/kelola-kelas", icon: "🎭", label: "Kelola Kelas/Fasilitas" },
  { id: "topeng", href: "#/kelola-topeng", icon: "🗿", label: "Kelola Topeng" },
  { id: "galeri", href: "#/kelola-galeri", icon: "🖼️", label: "Kelola Galeri" },
  { id: "edukasi", href: "#/kelola-edukasi", icon: "📚", label: "Kelola Edukasi" },
  { id: "artikel", href: "#/kelola-artikel", icon: "📰", label: "Kelola Artikel" },
  { id: "pengumuman", href: "#/kelola-pengumuman", icon: "📢", label: "Kelola Pengumuman" },
  { id: "forum", href: "#/kelola-forum", icon: "💬", label: "Kelola Forum" },
  { id: "media", href: "#/pustaka-media", icon: "🗂️", label: "Pustaka Media (Gambar)" },
  { id: "pembayaran", href: "#/pengaturan-pembayaran", icon: "💳", label: "Pengaturan Pembayaran" },
];

let built = false;

export function ensureShell() {
  if (built) return;
  built = true;
  document.getElementById("adminRoot").innerHTML = `
    <div class="a-overlay" id="aOverlay"></div>
    <aside class="a-sidebar" id="aSidebar">
      <div class="a-brand">asmorobangun<span>admin</span></div>
      <nav class="a-nav" id="aNav"></nav>
      <div class="a-sidebar-foot">
        <div class="a-admin-chip" id="aAdminChip"></div>
        <button class="a-logout-btn" id="aLogoutBtn">Keluar</button>
      </div>
    </aside>
    <div class="a-main">
      <header class="a-topbar">
        <button class="a-hamburger" id="aHamburger">☰</button>
        <div class="a-topbar-title" id="aPageTitle">Dashboard</div>
      </header>
      <main class="a-content" id="aContent"></main>
    </div>
  `;
  document.getElementById("aHamburger").addEventListener("click", toggleSidebar);
  document.getElementById("aOverlay").addEventListener("click", closeSidebar);
  document.getElementById("aLogoutBtn").addEventListener("click", () => {
    clearAdminSession();
    location.hash = "#/login";
    location.reload();
  });
}

function toggleSidebar() {
  document.getElementById("aSidebar").classList.toggle("open");
  document.getElementById("aOverlay").classList.toggle("open");
}
function closeSidebar() {
  document.getElementById("aSidebar").classList.remove("open");
  document.getElementById("aOverlay").classList.remove("open");
}

export function paintChrome(activeId, title) {
  ensureShell();
  const admin = currentAdmin();
  document.getElementById("aNav").innerHTML = MENU.map(
    (m) => `<a href="${m.href}" class="${m.id === activeId ? "active" : ""}" data-close-sidebar><span class="a-nav-icon">${m.icon}</span>${m.label}</a>`
  ).join("");
  document.getElementById("aAdminChip").innerHTML = admin ? `👤 ${admin.name}` : "";
  document.getElementById("aPageTitle").textContent = title || "";
  document.querySelectorAll("[data-close-sidebar]").forEach((a) => a.addEventListener("click", closeSidebar));
}

export function content() {
  ensureShell();
  return document.getElementById("aContent");
}
