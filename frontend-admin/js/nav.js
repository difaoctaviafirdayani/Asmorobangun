const ADMIN_NAV = [
  { id: "dashboard", href: "dashboard.html", icon: "📊", label: "Dashboard" },
  { id: "pendaftar", href: "data-pendaftar.html", icon: "🗂️", label: "Data Pendaftar" },
  { id: "kelas", href: "kelola-kelas.html", icon: "🎭", label: "Kelola Kelas" },
  { id: "topeng", href: "kelola-topeng.html", icon: "🪆", label: "Kelola Topeng" },
  { id: "galeri", href: "kelola-galeri.html", icon: "🖼️", label: "Kelola Galeri" },
  { id: "edukasi", href: "kelola-edukasi.html", icon: "📜", label: "Kelola Edukasi Budaya" },
  { id: "artikel", href: "kelola-artikel.html", icon: "📰", label: "Kelola Artikel/Berita" },
  { id: "pengumuman", href: "kelola-pengumuman.html", icon: "📢", label: "Kelola Pengumuman" },
  { id: "forum", href: "kelola-forum.html", icon: "💬", label: "Kelola Forum" },
];

function renderSidebar(active) {
  if (!requireAdminLogin()) return;
  const shell = document.querySelector(".admin-shell");
  if (!shell) return;
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <div class="wordmark">asmorobangun<div style="font-size:0.65rem;color:rgba(250,246,238,0.6);font-weight:500">Admin Dashboard</div></div>
    <nav>${ADMIN_NAV.map((n) => `<a href="${n.href}" class="${n.id === active ? "active" : ""}"><span class="ic">${n.icon}</span>${n.label}</a>`).join("")}</nav>
    <div class="sb-foot">Masuk sebagai<br/><strong style="color:#fff">${currentAdmin() ? currentAdmin().name : ""}</strong></div>
    <button class="logout-btn" onclick="clearSession();location.href='login.html'">↩ Keluar</button>
  `;
  shell.prepend(sidebar);
}
