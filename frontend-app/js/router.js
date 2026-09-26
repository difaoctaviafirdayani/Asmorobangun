import { renderBottomNav } from "./chrome.js";
import { unmountTopengAI } from "./topeng-ai.js";

import homePage from "./pages/home.js";
import facilitiesPage from "./pages/facilities.js";
import facilityDetailPage from "./pages/facilityDetail.js";
import topengPage from "./pages/topeng.js";
import topengDetailPage from "./pages/topengDetail.js";
import orderChatPage from "./pages/orderChat.js";
import articlesPage from "./pages/articles.js";
import articleDetailPage from "./pages/articleDetail.js";
import announcementsPage from "./pages/announcements.js";
import announcementDetailPage from "./pages/announcementDetail.js";
import galleryPage from "./pages/gallery.js";
import forumPage from "./pages/forum.js";
import forumThreadPage from "./pages/forumThread.js";
import loginPage from "./pages/login.js";
import registerPage from "./pages/register.js";
import profilePage from "./pages/profile.js";
import myOrdersPage from "./pages/myOrders.js";

// Each route: { pattern (regex), keys, page: {nav, render, isTopeng} }
const routes = [
  { path: /^\/$/, keys: [], page: homePage },
  { path: /^\/facilities$/, keys: [], page: facilitiesPage },
  { path: /^\/facilities\/([^/]+)$/, keys: ["id"], page: facilityDetailPage },
  { path: /^\/topeng$/, keys: [], page: topengPage },
  { path: /^\/topeng\/order\/([^/]+)$/, keys: ["id"], page: orderChatPage },
  { path: /^\/topeng\/([^/]+)$/, keys: ["id"], page: topengDetailPage },
  { path: /^\/articles$/, keys: [], page: articlesPage },
  { path: /^\/articles\/([^/]+)$/, keys: ["slug"], page: articleDetailPage },
  { path: /^\/announcements$/, keys: [], page: announcementsPage },
  { path: /^\/announcements\/([^/]+)$/, keys: ["id"], page: announcementDetailPage },
  { path: /^\/gallery$/, keys: [], page: galleryPage },
  { path: /^\/forum$/, keys: [], page: forumPage },
  { path: /^\/forum\/([^/]+)$/, keys: ["id"], page: forumThreadPage },
  { path: /^\/login$/, keys: [], page: loginPage },
  { path: /^\/register$/, keys: [], page: registerPage },
  { path: /^\/profile$/, keys: [], page: profilePage },
  { path: /^\/my-orders$/, keys: [], page: myOrdersPage },
];

function parseHash() {
  let hash = location.hash || "#/";
  hash = hash.replace(/^#/, "");
  const [pathPart, queryPart] = hash.split("?");
  const params = new URLSearchParams(queryPart || "");
  return { path: pathPart || "/", query: params };
}

export async function renderRoute() {
  const app = document.getElementById("app");
  const { path } = parseHash();

  let matched = null;
  let paramValues = {};
  for (const r of routes) {
    const m = path.match(r.path);
    if (m) {
      matched = r;
      r.keys.forEach((k, i) => (paramValues[k] = decodeURIComponent(m[i + 1])));
      break;
    }
  }

  if (!matched) {
    app.innerHTML = `<div class="section"><div class="empty-state"><div class="e-icon">🗺️</div>Halaman tidak ditemukan.</div></div>`;
    renderBottomNav("");
    window.scrollTo(0, 0);
    return;
  }

  if (!matched.page.isTopeng) unmountTopengAI();

  try {
    await matched.page.render(app, paramValues);
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="section"><div class="empty-state">Terjadi kesalahan memuat halaman.</div></div>`;
  }
  renderBottomNav(matched.page.nav || "");
  window.scrollTo(0, 0);
}

export function initRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}
