import { api, requireLoginOrRedirect, formatRupiah, formatDate, statusLabel, escapeHtml, assetUrl } from "../api.js";

async function render(container) {
  if (!requireLoginOrRedirect()) return;
  container.innerHTML = `
    <div class="topbar"><div class="topbar-row"><button class="icon-btn" data-nav="#/profile">←</button><div class="wordmark" style="font-size:1.05rem">Pesanan Saya</div></div></div>
    <div class="section" style="display:flex;gap:8px" id="tabRow">
      <button class="tag" data-tab="topeng" style="background:var(--wood-800);color:#fff;border:none">Pesanan Topeng</button>
      <button class="tag" data-tab="bookings" style="background:var(--cream-300);color:var(--wood-900);border:none">Pendaftaran &amp; Booking</button>
    </div>
    <div class="section" id="list">Memuat...</div>
  `;
  let tab = "topeng";
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.getAttribute("data-tab");
      document.querySelectorAll("[data-tab]").forEach((b) => {
        const active = b === btn;
        b.style.background = active ? "var(--wood-800)" : "var(--cream-300)";
        b.style.color = active ? "#fff" : "var(--wood-900)";
      });
      paint(tab);
    });
  });
  await paint(tab);
}

async function paint(tab) {
  const list = document.getElementById("list");
  list.innerHTML = "Memuat...";
  if (tab === "topeng") {
    const { orders } = await api("/topeng/orders/mine", { auth: true });
    list.innerHTML = orders.length
      ? orders
          .map((o) => {
            const [label, tone] = statusLabel(o.status);
            return `<a class="menu-row" href="#/topeng/order/${o.id}">
              <img class="m-icon" src="${assetUrl(o.topengImage)}" onerror="this.style.display='none'" style="object-fit:cover"/>
              <div class="m-body">
                <div class="m-title">${escapeHtml(o.topengName)} x${o.qty}</div>
                <div class="m-sub">${formatRupiah(o.total)} · ${formatDate(o.createdAt)}</div>
              </div>
              <span class="status-chip ${tone}">${label}</span>
            </a>`;
          })
          .join("")
      : `<div class="empty-state"><div class="e-icon">🪆</div>Belum ada pesanan topeng.</div>`;
  } else {
    const { bookings } = await api("/bookings/mine", { auth: true });
    list.innerHTML = bookings.length
      ? bookings
          .map((b) => {
            const [label, tone] = statusLabel(b.status);
            return `<div class="menu-row">
              <div class="m-icon">🎭</div>
              <div class="m-body">
                <div class="m-title">${escapeHtml(b.facilityName)}</div>
                <div class="m-sub">${b.date ? formatDate(b.date) : ""} ${b.amount ? "· " + formatRupiah(b.amount) : ""}</div>
              </div>
              <span class="status-chip ${tone}">${label}</span>
            </div>`;
          })
          .join("")
      : `<div class="empty-state"><div class="e-icon">🎭</div>Belum ada pendaftaran/booking.</div>`;
  }
}

export default { nav: "profile", render };
