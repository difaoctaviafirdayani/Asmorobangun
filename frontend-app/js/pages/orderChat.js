import { api, requireLoginOrRedirect, formatRupiah, statusLabel, escapeHtml, showToast } from "../api.js";
import { mountTopengAI } from "../topeng-ai.js";
import { renderPaymentBlock } from "../payment.js";

async function render(container, { id: oid }) {
  if (!requireLoginOrRedirect()) return;
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/my-orders">←</button></div>
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

      <div class="section-head"><h3 style="font-size:0.95rem">Chat dengan admin</h3></div>
      <div class="chat-thread" id="chatThread">
        ${order.chatLog.map((m) => `<div class="chat-bubble ${m.from}">${escapeHtml(m.text)}</div>`).join("")}
      </div>
      <div class="chat-input-row">
        <input id="chatInput" placeholder="Tulis pesan..." />
        <button class="btn btn-primary btn-sm" id="chatSendBtn">Kirim</button>
      </div>

      <div class="section" style="padding:20px 0 0" id="paymentSection">
        <div class="section-head"><h3 style="font-size:0.95rem">Pembayaran</h3></div>
        ${renderPaymentBlock({ kind: "topeng", id: oid, amount: order.total, existingProof: order.proofFile, existingMethod: order.paymentMethod })}
      </div>
    `;
    document.getElementById("chatThread").scrollTop = 999999;
    document.getElementById("chatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMsg(oid);
    });
    document.getElementById("chatSendBtn").addEventListener("click", () => sendMsg(oid));

    window.addEventListener("payment:done", function handler() {
      window.removeEventListener("payment:done", handler);
      load(oid);
    });
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Pesanan tidak ditemukan.</div>`;
  }
}

async function sendMsg(oid) {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  try {
    await api(`/topeng/orders/${oid}/message`, { method: "POST", auth: true, body: { text } });
    load(oid);
  } catch (err) {
    showToast(err.message);
  }
}

export default { nav: "profile", isTopeng: true, render };
