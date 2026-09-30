import { currentAdmin, clearAdminSession } from "./api.js";
import { icon } from "./icons.js";

const MENU = [
  { id: "dashboard", href: "#/dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "pendaftar", href: "#/pendaftar", icon: "receipt", label: "Pendaftar & Booking" },
  { id: "topeng-orders", href: "#/pesanan-topeng", icon: "topeng", label: "Pesanan Topeng" },
  { id: "kelas", href: "#/kelola-kelas", icon: "facilities", label: "Kelola Kelas/Fasilitas" },
  { id: "topeng", href: "#/kelola-topeng", icon: "topeng", label: "Kelola Topeng" },
  { id: "galeri", href: "#/kelola-galeri", icon: "gallery", label: "Kelola Galeri" },
  { id: "edukasi", href: "#/kelola-edukasi", icon: "book", label: "Kelola Edukasi" },
  { id: "artikel", href: "#/kelola-artikel", icon: "article", label: "Kelola Artikel" },
  { id: "pengumuman", href: "#/kelola-pengumuman", icon: "announce", label: "Kelola Pengumuman" },
  { id: "forum", href: "#/kelola-forum", icon: "chat", label: "Kelola Forum" },
];

let built = false;

export function ensureShell() {
  if (built) return;
  built = true;
  document.getElementById("adminRoot").innerHTML = `
    <div class="a-overlay" id="aOverlay"></div>
    <aside class="a-sidebar" id="aSidebar">
     <div class="a-brand"><img class="a-logo" src="assets/logo-gold.png" alt="asmorobangun" /><span>admin</span></div>
      <nav class="a-nav" id="aNav"></nav>
      <div class="a-sidebar-foot">
        <div class="a-admin-chip" id="aAdminChip"></div>
        <button class="a-logout-btn" id="aLogoutBtn">Keluar</button>
      </div>
    </aside>
    <div class="a-main">
      <header class="a-topbar">
        <button class="a-hamburger" id="aHamburger" aria-label="Menu">${icon("menu")}</button>
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
    (m) => `<a href="${m.href}" class="${m.id === activeId ? "active" : ""}" data-close-sidebar><span class="a-nav-icon">${icon(m.icon)}</span>${m.label}</a>`
  ).join("");
  document.getElementById("aAdminChip").innerHTML = admin ? `${icon("account")} ${admin.name}` : "";
  document.getElementById("aPageTitle").textContent = title || "";
  document.querySelectorAll("[data-close-sidebar]").forEach((a) => a.addEventListener("click", closeSidebar));
}

export function content() {
  ensureShell();
  return document.getElementById("aContent");
}
