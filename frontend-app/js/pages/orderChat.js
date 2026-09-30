import { icon } from "../icons.js";
import { api, requireLoginOrRedirect, formatRupiah, statusLabel, escapeHtml } from "../api.js";
import { mountTopengAI } from "../topeng-ai.js";
import { renderPaymentBlock } from "../payment.js";

async function render(container, { id: oid }) {
  if (!requireLoginOrRedirect()) return;
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/my-orders">${icon("back")}</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  await load(oid);
  mountTopengAI();
}

async function load(oid) {
  const content = document.getElementById("content");
  try {
    const { order } = await api(`/topeng/orders/${oid}`, { auth: true });
    const [label, tone] = statusLabel(order.status);
    content.innerHTML = `
      <h2>${escapeHtml(order.topengName)}</h2>
      <div class="card card-pad" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span>Jumlah</span><strong>${order.qty}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem"><span>Total</span><strong>${formatRupiah(order.total)}</strong></div>
        ${order.customName ? `<div style="display:flex;justify-content:space-between;font-size:0.85rem"><span>Nama custom</span><strong>${escapeHtml(order.customName)}</strong></div>` : ""}
        ${order.customDesign ? `<div style="font-size:0.8rem;color:var(--ink-soft);margin-top:6px">Desain custom: ${escapeHtml(order.customDesign)}</div>` : ""}
        <div style="margin-top:8px"><span class="status-chip ${tone}">${label}</span></div>
      </div>

      <div class="section" style="padding:20px 0 0" id="paymentSection">
        <div class="section-head"><h3 style="font-size:0.95rem">Pembayaran</h3></div>
        ${renderPaymentBlock({ kind: "topeng", id: oid, amount: order.total, existingProof: order.proofFile, existingMethod: order.paymentMethod })}
      </div>
    `;
    window.addEventListener("payment:done", function handler() {
      window.removeEventListener("payment:done", handler);
      load(oid);
    });
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Pesanan tidak ditemukan.</div>`;
  }
}

export default { nav: "profile", isTopeng: true, render };
