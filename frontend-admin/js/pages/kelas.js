import { api, escapeHtml, showToast, formatDate, formatRupiah, assetUrl } from "../api.js";
import { renderImageField, wireImageField } from "../imageField.js";
import { icon } from "../icons.js";
import { actionCell, detailList, truncate, openModal, closeModal } from "../ui.js";

let facilities = [];

// Layanan berjenis "event" (Panggilan Tari, Kunjungan Edukasi) belum punya info pembayaran,
// jadi bagian Metode Pembayaran tidak ditampilkan & tidak disimpan.
const isEvent = (f) => f.bookingType === "event";

function readMethods(f) {
  const p = f.paymentMethods || {};
  return {
    cash: { enabled: !p.cash || p.cash.enabled !== false, note: (p.cash && p.cash.note) || "" },
    transfer: { enabled: !p.transfer || p.transfer.enabled !== false, note: (p.transfer && p.transfer.note) || "" },
    qris: { enabled: !p.qris || p.qris.enabled !== false, image: (p.qris && p.qris.image) || "" },
  };
}

function starsView(n) {
  const r = Math.round(n || 0);
  return `<span class="a-stars">${icon("star").repeat(r)}<span class="off">${icon("star").repeat(5 - r)}</span></span>`;
}

async function render(el) {
  el.innerHTML = `
    <div class="a-card"><div class="a-table-wrap"><table class="a-table a-compact">
      <thead><tr><th>Nama</th><th>Harga</th><th>Deskripsi</th><th>Aksi</th></tr></thead>
      <tbody id="tbody"><tr><td colspan="4">Memuat...</td></tr></tbody>
    </table></div></div>`;
  await load();
}

async function load() {
  const data = await api("/facilities");
  facilities = data.facilities;
  document.getElementById("tbody").innerHTML = facilities
    .map(
      (f) => `<tr>
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(truncate(f.priceInfo, 40))}</td>
        <td><span class="a-clamp">${escapeHtml(truncate(f.longDesc, 90))}</span></td>
        <td>${actionCell(f.id)}</td>
      </tr>`
    )
    .join("");
  document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openDetail(b.getAttribute("data-detail"))));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openEdit(b.getAttribute("data-edit"))));
}

/* ---------- DETAIL (hanya-baca) + kelola ulasan (hanya hapus) ---------- */
async function openDetail(fid) {
  const f = facilities.find((x) => x.id === fid);
  openModal(`
    <h3>${escapeHtml(f.name)}</h3>
    ${f.image ? `<img class="a-detail-img" src="${assetUrl(f.image)}" onerror="this.style.display='none'" />` : ""}
    ${detailList([
      ["Kategori", escapeHtml(f.category)],
      ["Harga", escapeHtml(f.priceInfo)],
      ["Deskripsi singkat", escapeHtml(f.shortDesc)],
      ["Deskripsi lengkap", escapeHtml(f.longDesc)],
      ["Rating rata-rata", f.avgRating ? `${starsView(f.avgRating)} ${f.avgRating} (${f.reviewCount} ulasan)` : "Belum ada ulasan"],
    ])}
    <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
      <div style="font-weight:700;font-size:0.85rem;margin-bottom:4px">Ulasan pendaftar</div>
      <div class="a-field-hint" style="margin-bottom:8px">Ulasan tidak bisa diedit. Admin hanya bisa menghapus ulasan, atau membiarkannya tetap tersimpan.</div>
      <div id="revWrap"><div class="a-field-hint">Memuat ulasan...</div></div>
    </div>
    <div class="a-modal-foot"><button class="a-btn a-btn-ghost" id="closeBtn">Tutup</button></div>
  `);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
  loadReviews(fid);
}

async function loadReviews(fid) {
  const wrap = document.getElementById("revWrap");
  if (!wrap) return;
  try {
    const { reviews } = await api(`/facilities/${fid}`);
    wrap.innerHTML = reviews.length
      ? reviews
          .map(
            (r) => `<div class="a-review-row">
              <div class="a-review-head"><strong>${escapeHtml(r.userName)}</strong><span class="a-field-hint" style="margin:0">${formatDate(r.date)}</span></div>
              <div style="margin:4px 0">${starsView(r.rating)}</div>
              <div style="font-size:0.85rem;white-space:pre-wrap">${escapeHtml(r.comment)}</div>
              <div style="margin-top:8px"><button type="button" class="a-btn a-btn-danger a-btn-sm" data-del-review="${r.id}">Hapus ulasan</button></div>
            </div>`
          )
          .join("")
      : `<div class="a-empty">Belum ada ulasan pendaftar.</div>`;
    wrap.querySelectorAll("[data-del-review]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Hapus ulasan ini?")) return;
        try {
          await api(`/facilities/${fid}/reviews/${btn.getAttribute("data-del-review")}`, { method: "DELETE" });
          showToast("Ulasan dihapus.");
          await load(); // perbarui rating rata-rata
          const f = facilities.find((x) => x.id === fid);
          if (f) openDetail(fid);
        } catch (err) {
          showToast(err.message);
        }
      })
    );
  } catch (err) {
    wrap.innerHTML = `<div class="a-empty">Gagal memuat ulasan.</div>`;
  }
}

/* ---------- EDIT ---------- */
function openEdit(fid) {
  const f = facilities.find((x) => x.id === fid);
  const m = readMethods(f);
  const ev = isEvent(f);
  const body = openModal(`
    <h3>Edit: ${escapeHtml(f.name)}</h3>
    <form id="editForm">
      <div class="a-field"><label>Nama</label><input name="name" value="${escapeHtml(f.name)}" /></div>
      <div class="a-field"><label>Harga</label><input name="priceInfo" value="${escapeHtml(f.priceInfo)}" /></div>
      <div class="a-field"><label>Deskripsi</label><textarea name="longDesc" rows="4">${escapeHtml(f.longDesc)}</textarea></div>

      ${
        ev
          ? `<div class="a-field-hint" style="margin-bottom:12px">Layanan ini belum memakai pembayaran di muka (melalui penawaran admin), jadi tidak ada pengaturan metode pembayaran.</div>`
          : `<div class="a-field">
              <label>Metode Pembayaran</label>
              <div class="a-method-box">
                <label class="a-check-label"><input type="checkbox" name="cashEnabled" ${m.cash.enabled ? "checked" : ""} /> Tunai</label>
                <label class="a-sublabel">Catatan</label>
                <input name="cashNote" placeholder="mis. Bayar di sanggar" value="${escapeHtml(m.cash.note)}" />
              </div>
              <div class="a-method-box">
                <label class="a-check-label"><input type="checkbox" name="transferEnabled" ${m.transfer.enabled ? "checked" : ""} /> Transfer Bank</label>
                <label class="a-sublabel">Catatan</label>
                <input name="transferNote" placeholder="mis. 1234567890 (BCA a.n. Sanggar Asmorobangun)" value="${escapeHtml(m.transfer.note)}" />
              </div>
              <div class="a-method-box">
                <label class="a-check-label"><input type="checkbox" name="qrisEnabled" ${m.qris.enabled ? "checked" : ""} /> QRIS</label>
                ${renderImageField("qrisImg", "Gambar QRIS Merchant", m.qris.image)}
              </div>
            </div>`
      }

      ${renderImageField("facImg", "Gambar", f.image)}
      <div class="a-modal-foot">
        <button type="button" class="a-btn a-btn-ghost" id="cancelBtn">Batal</button>
        <button type="submit" class="a-btn a-btn-primary">Simpan</button>
      </div>
    </form>
  `);
  wireImageField("facImg");
  if (!ev) wireImageField("qrisImg");
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  body.querySelector("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const g = (n) => e.target.elements[n];
    const payload = {
      name: g("name").value,
      priceInfo: g("priceInfo").value,
      longDesc: g("longDesc").value,
      image: document.getElementById("facImg").value,
    };
    if (!ev) {
      payload.paymentMethods = {
        cash: { enabled: g("cashEnabled").checked, note: g("cashNote").value },
        transfer: { enabled: g("transferEnabled").checked, note: g("transferNote").value },
        qris: { enabled: g("qrisEnabled").checked, image: document.getElementById("qrisImg").value },
      };
    }
    try {
      await api(`/facilities/${fid}`, { method: "PATCH", body: payload });
      showToast("Fasilitas diperbarui.");
      closeModal();
      load();
    } catch (err) {
      showToast(err.message);
    }
  });
}

export default { render };
