import { api, escapeHtml, showToast } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";

// Baca pengaturan metode pembayaran per fasilitas (default: semua aktif)
function readMethods(f) {
  const p = f.paymentMethods || {};
  return {
    cash: { enabled: !p.cash || p.cash.enabled !== false, note: (p.cash && p.cash.note) || "" },
    transfer: { enabled: !p.transfer || p.transfer.enabled !== false, note: (p.transfer && p.transfer.note) || "" },
    qris: { enabled: !p.qris || p.qris.enabled !== false, image: (p.qris && p.qris.image) || "" },
  };
}

async function render(el) {
  el.innerHTML = `<div id="list">Memuat...</div>`;
  const { facilities } = await api("/facilities");

  document.getElementById("list").innerHTML = facilities
    .map((f) => {
      const m = readMethods(f);
      return `<div class="a-card a-card-pad" style="margin-bottom:16px">
        <h3 style="font-size:1rem;margin-bottom:12px">${escapeHtml(f.name)}</h3>
        <form data-fid="${f.id}">
          <div class="a-field"><label>Nama</label><input name="name" value="${escapeHtml(f.name)}" /></div>
          <div class="a-field"><label>Harga</label><input name="priceInfo" value="${escapeHtml(f.priceInfo)}" /></div>
          <div class="a-field"><label>Deskripsi</label><textarea name="longDesc" rows="4">${escapeHtml(f.longDesc)}</textarea></div>

          <div class="a-field">
            <label>Metode Pembayaran</label>

            <div class="a-method-box">
              <label class="a-check-label">
                <input type="checkbox" name="cashEnabled" ${m.cash.enabled ? "checked" : ""} /> Tunai
              </label>
              <label class="a-sublabel">Catatan</label>
              <input name="cashNote" placeholder="mis. Bayar di sanggar" value="${escapeHtml(m.cash.note)}" />
            </div>

            <div class="a-method-box">
              <label class="a-check-label">
                <input type="checkbox" name="transferEnabled" ${m.transfer.enabled ? "checked" : ""} /> Transfer Bank
              </label>
              <label class="a-sublabel">Catatan</label>
              <input name="transferNote" placeholder="mis. 1234567890 (BCA a.n. Sanggar Asmorobangun)" value="${escapeHtml(m.transfer.note)}" />
            </div>

            <div class="a-method-box">
              <label class="a-check-label">
                <input type="checkbox" name="qrisEnabled" ${m.qris.enabled ? "checked" : ""} /> QRIS
              </label>
              ${renderImageField(`qris-${f.id}`, "Gambar QRIS Merchant", m.qris.image)}
            </div>
          </div>

          ${renderImageField(`img-${f.id}`, "Gambar", f.image)}
          <button class="a-btn a-btn-primary" type="submit">Simpan</button>
        </form>
      </div>`;
    })
    .join("");

  facilities.forEach((f) => {
    wireImageField(`img-${f.id}`);
    wireImageField(`qris-${f.id}`);
  });

  // Simpan
  document.querySelectorAll("form[data-fid]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fid = form.getAttribute("data-fid");
      const g = (n) => form.elements[n];
      const body = {
        name: g("name").value,
        priceInfo: g("priceInfo").value,
        longDesc: g("longDesc").value,
        image: document.getElementById(`img-${fid}`).value,
        paymentMethods: {
          cash: { enabled: g("cashEnabled").checked, note: g("cashNote").value },
          transfer: { enabled: g("transferEnabled").checked, note: g("transferNote").value },
          qris: { enabled: g("qrisEnabled").checked, image: document.getElementById(`qris-${fid}`).value },
        },
      };
      try {
        await api(`/facilities/${fid}`, { method: "PATCH", body });
        showToast("Fasilitas diperbarui.");
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

export default { render };
