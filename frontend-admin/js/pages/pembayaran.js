import { api, escapeHtml, showToast } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";

async function render(el) {
  el.innerHTML = `<div id="wrap">Memuat...</div>`;
  const { settings } = await api("/payments/settings");
  document.getElementById("wrap").innerHTML = `
    <div class="a-card a-card-pad" style="max-width:520px">
      <h3 style="font-size:1rem">Pengaturan Rekening &amp; QRIS</h3>
      <p class="a-field-hint" style="margin-bottom:16px">Informasi ini langsung ditampilkan ke pembeli saat memilih Transfer Bank / QRIS. QRIS di sini dipakai untuk pesanan topeng dan untuk layanan yang belum punya QRIS sendiri di menu Kelola Kelas/Fasilitas.</p>
      <form id="payForm">
        <div class="a-field"><label>Nama Bank</label><input name="bankName" value="${escapeHtml(settings.bankName)}" /></div>
        <div class="a-field"><label>Nomor Rekening</label><input name="accountNumber" value="${escapeHtml(settings.accountNumber)}" /></div>
        <div class="a-field"><label>Atas Nama</label><input name="accountName" value="${escapeHtml(settings.accountName)}" /></div>
        <div class="a-field"><label>Nama Merchant QRIS</label><input name="qrisMerchantName" value="${escapeHtml(settings.qrisMerchantName)}" /></div>
        ${renderImageField("qrisGlobal", "Gambar QRIS Merchant", settings.qrisImage || "")}
        <div class="a-field"><label>Nomor WhatsApp Admin</label><input name="whatsapp" value="${escapeHtml(settings.whatsapp)}" /></div>
        <button class="a-btn a-btn-primary" type="submit">Simpan Pengaturan</button>
      </form>
    </div>
  `;
  wireImageField("qrisGlobal");
  document.getElementById("payForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.qrisImage = document.getElementById("qrisGlobal").value;
    try {
      await api("/payments/settings", { method: "PATCH", body });
      showToast("Pengaturan pembayaran disimpan.");
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
