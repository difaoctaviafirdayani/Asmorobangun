import { api, isLoggedIn, requireLoginOrRedirect, formatRupiah, assetUrl, escapeHtml, showToast } from "../api.js";
import { mountTopengAI } from "../topeng-ai.js";

async function render(container, { id: tid }) {
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/topeng">←</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  try {
    const { topeng: t } = await api(`/topeng/${tid}`);
    document.getElementById("content").innerHTML = `
      <img class="detail-hero" style="border-radius:16px" src="${assetUrl(t.image)}" onerror="this.src='https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=700'"/>
      <div style="margin-top:14px">
        <h2>${escapeHtml(t.name)}</h2>
        <div style="font-size:0.85rem;color:var(--ink-soft)">${escapeHtml(t.character)} · Warna dominan: ${escapeHtml(t.color)}</div>
        <div style="font-weight:700;color:var(--wood-800);font-size:1.2rem;margin:10px 0">${formatRupiah(t.price)}</div>
        <p>${escapeHtml(t.desc)}</p>
        <div class="field-hint">Stok tersedia: ${t.stock}</div>
      </div>

      <div class="section" style="padding:16px 0 0">
        <div class="section-head"><h3>Pesan topeng ini</h3></div>
        ${!isLoggedIn() ? `<div class="card card-pad" style="background:#fbeecc;margin-bottom:12px"><a href="#/login">Masuk</a> dulu untuk memesan.</div>` : ""}
        <div class="card card-pad" id="orderCard" style="${!isLoggedIn() ? "opacity:0.5;pointer-events:none" : ""}">
          <div class="field"><label>Jumlah</label><input type="number" id="qty" value="1" min="1" /></div>
          <div class="field">
            <label><input type="checkbox" id="wantCustom" /> Saya ingin request nama/desain custom</label>
          </div>
          <div id="customFields" style="display:none">
            <div class="field"><label>Nama custom (untuk diukir/label)</label><input id="customName" placeholder="mis. nama penerima hadiah" /></div>
            <div class="field"><label>Detail desain custom</label><textarea id="customDesign" rows="2" placeholder="Jelaskan warna/karakter/detail yang diinginkan"></textarea></div>
          </div>
          <div class="field"><label>Nomor WhatsApp kamu</label><input id="buyerPhone" placeholder="08xxxxxxxxxx" /></div>
          <div class="field"><label>Catatan tambahan</label><textarea id="message" rows="2" placeholder="Pesan untuk admin (opsional)"></textarea></div>
          <button class="btn btn-primary" id="submitOrderBtn">🛒 Pesan &amp; Lanjut Chat</button>
        </div>
      </div>
    `;
    document.getElementById("wantCustom").addEventListener("change", (e) => {
      document.getElementById("customFields").style.display = e.target.checked ? "block" : "none";
    });
    document.getElementById("submitOrderBtn").addEventListener("click", () => submitOrder(tid));
  } catch (err) {
    document.getElementById("content").innerHTML = `<div class="empty-state">Topeng tidak ditemukan.</div>`;
  }
  mountTopengAI();
}

async function submitOrder(tid) {
  if (!requireLoginOrRedirect()) return;
  const wantCustom = document.getElementById("wantCustom").checked;
  const body = {
    qty: document.getElementById("qty").value,
    customName: wantCustom ? document.getElementById("customName").value : null,
    customDesign: wantCustom ? document.getElementById("customDesign").value : null,
    buyerPhone: document.getElementById("buyerPhone").value,
    message: document.getElementById("message").value,
  };
  try {
    const { order } = await api(`/topeng/${tid}/order`, { method: "POST", auth: true, body });
    showToast("Pesanan dibuat, lanjut chat dengan admin!");
    location.hash = `#/topeng/order/${order.id}`;
  } catch (err) {
    showToast(err.message);
  }
}

export default { nav: "topeng", isTopeng: true, render };
