import { isAdminLoggedIn } from "./api.js";
import { paintChrome, content } from "./chrome.js";

import loginPage from "./pages/login.js";
import dashboardPage from "./pages/dashboard.js";
import pendaftarPage from "./pages/pendaftar.js";
import topengOrdersPage from "./pages/topengOrders.js";
import kelasPage from "./pages/kelas.js";
import topengPage from "./pages/topeng.js";
import galeriPage from "./pages/galeri.js";
import edukasiPage from "./pages/edukasi.js";
import artikelPage from "./pages/artikel.js";
import pengumumanPage from "./pages/pengumuman.js";
import forumPage from "./pages/forum.js";
import mediaPage from "./pages/media.js";
import pembayaranPage from "./pages/pembayaran.js";

const routes = {
  "/login": { page: loginPage, public: true },
  "/dashboard": { page: dashboardPage, nav: "dashboard", title: "Dashboard" },
  "/pendaftar": { page: pendaftarPage, nav: "pendaftar", title: "Pendaftar & Booking" },
  "/pesanan-topeng": { page: topengOrdersPage, nav: "topeng-orders", title: "Pesanan Topeng" },
  "/kelola-kelas": { page: kelasPage, nav: "kelas", title: "Kelola Kelas/Fasilitas" },
  "/kelola-topeng": { page: topengPage, nav: "topeng", title: "Kelola Topeng" },
  "/kelola-galeri": { page: galeriPage, nav: "galeri", title: "Kelola Galeri" },
  "/kelola-edukasi": { page: edukasiPage, nav: "edukasi", title: "Kelola Edukasi" },
  "/kelola-artikel": { page: artikelPage, nav: "artikel", title: "Kelola Artikel" },
  "/kelola-pengumuman": { page: pengumumanPage, nav: "pengumuman", title: "Kelola Pengumuman" },
  "/kelola-forum": { page: forumPage, nav: "forum", title: "Kelola Forum" },
  "/pustaka-media": { page: mediaPage, nav: "media", title: "Pustaka Media (Gambar)" },
  "/pengaturan-pembayaran": { page: pembayaranPage, nav: "pembayaran", title: "Pengaturan Pembayaran" },
};

function parseHash() {
  const hash = (location.hash || "#/login").replace(/^#/, "");
  return hash || "/login";
}

export async function renderRoute() {
  const path = parseHash();
  const route = routes[path] || routes["/dashboard"];

  if (!route.public && !isAdminLoggedIn()) {
    location.hash = "#/login";
    return;
  }
  if (route.public && isAdminLoggedIn() && path === "/login") {
    location.hash = "#/dashboard";
    return;
  }

  if (route.public) {
    document.getElementById("adminRoot").innerHTML = "";
    const wrap = document.createElement("div");
    wrap.id = "loginRoot";
    document.getElementById("adminRoot").appendChild(wrap);
    await route.page.render(wrap);
    return;
  }

  paintChrome(route.nav, route.title);
  const el = content();
  el.innerHTML = "Memuat...";
  try {
    await route.page.render(el);
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="a-empty">Terjadi kesalahan memuat halaman.</div>`;
  }
}

export function initRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}
