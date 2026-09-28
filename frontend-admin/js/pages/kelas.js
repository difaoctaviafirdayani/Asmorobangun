import { api, escapeHtml, showToast, formatDate } from "../api.js";
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

function starButtons(reviewId, currentRating) {
  return [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button type="button" class="a-star-btn ${n <= currentRating ? "on" : ""}" data-review-star="${reviewId}" data-star="${n}">★</button>`
    )
    .join("");
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

        <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
          <button type="button" class="a-btn a-btn-outline a-btn-sm" data-toggle-reviews="${f.id}">
            ⭐ Kelola Ulasan Pendaftar${f.reviewCount ? ` (${f.reviewCount})` : ""}
          </button>
          <div id="reviews-${f.id}" style="display:none;margin-top:12px"></div>
        </div>
      </div>`;
    })
    .join("");

  facilities.forEach((f) => {
    wireImageField(`img-${f.id}`);
    wireImageField(`qris-${f.id}`);
  });

  // Toggle & muat bagian Ulasan Pendaftar per fasilitas
  document.querySelectorAll("[data-toggle-reviews]").forEach((btn) => {
    const fid = btn.getAttribute("data-toggle-reviews");
    btn.addEventListener("click", async () => {
      const wrap = document.getElementById(`reviews-${fid}`);
      const opening = wrap.style.display === "none";
      wrap.style.display = opening ? "block" : "none";
      if (opening && !wrap.dataset.loaded) {
        await loadReviews(fid, wrap);
        wrap.dataset.loaded = "1";
      }
    });
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

async function loadReviews(fid, wrap) {
  wrap.innerHTML = `<div class="a-field-hint">Memuat ulasan...</div>`;
  try {
    const { reviews } = await api(`/facilities/${fid}`);
    paintReviews(fid, wrap, reviews);
  } catch (err) {
    wrap.innerHTML = `<div class="a-empty">Gagal memuat ulasan.</div>`;
  }
}

function paintReviews(fid, wrap, reviews) {
  wrap.innerHTML = reviews.length
    ? reviews
        .map(
          (r) => `<div class="a-review-row" data-review-id="${r.id}">
            <div class="a-review-head">
              <strong>${escapeHtml(r.userName)}</strong>
              <span class="a-field-hint" style="margin:0">${formatDate(r.date)}</span>
            </div>
            <div class="a-star-input" style="margin:6px 0">${starButtons(r.id, r.rating)}</div>
            <textarea class="a-review-comment" rows="2">${escapeHtml(r.comment)}</textarea>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button type="button" class="a-btn a-btn-outline a-btn-sm" data-save-review="${r.id}">Simpan Ulasan</button>
              <button type="button" class="a-btn a-btn-danger a-btn-sm" data-del-review="${r.id}">Hapus</button>
            </div>
          </div>`
        )
        .join("")
    : `<div class="a-empty">Belum ada ulasan pendaftar untuk fasilitas ini.</div>`;

  // Klik bintang -> ubah rating di tampilan (belum tersimpan sampai klik Simpan Ulasan)
  wrap.querySelectorAll("[data-review-star]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rid = btn.getAttribute("data-review-star");
      const val = Number(btn.getAttribute("data-star"));
      wrap.querySelectorAll(`[data-review-star="${rid}"]`).forEach((b) => {
        b.classList.toggle("on", Number(b.getAttribute("data-star")) <= val);
      });
      wrap.querySelector(`[data-review-id="${rid}"]`).dataset.newRating = val;
    });
  });

  // Simpan perubahan rating & komentar
  wrap.querySelectorAll("[data-save-review]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const rid = btn.getAttribute("data-save-review");
      const row = wrap.querySelector(`[data-review-id="${rid}"]`);
      const comment = row.querySelector(".a-review-comment").value;
      const ratingAttr = row.dataset.newRating;
      const body = { comment };
      if (ratingAttr) body.rating = Number(ratingAttr);
      try {
        await api(`/facilities/${fid}/reviews/${rid}`, { method: "PATCH", body });
        showToast("Ulasan diperbarui.");
        await loadReviews(fid, wrap);
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  // Hapus ulasan
  wrap.querySelectorAll("[data-del-review]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const rid = btn.getAttribute("data-del-review");
      if (!confirm("Hapus ulasan ini?")) return;
      try {
        await api(`/facilities/${fid}/reviews/${rid}`, { method: "DELETE" });
        showToast("Ulasan dihapus.");
        await loadReviews(fid, wrap);
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

export default { render };