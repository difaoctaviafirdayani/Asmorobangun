import { api, isLoggedIn, requireLoginOrRedirect, stars, formatDate, formatRupiah, escapeHtml, assetUrl, showToast } from "../api.js";
import { topbar } from "../chrome.js";
import { renderPaymentBlock } from "../payment.js";

function bookingHeading(f) {
  return { wisata: "Daftar & bayar", reguler: "Formulir pendaftaran", rental: "Ajukan sewa", event: "Ajukan panggilan / kunjungan" }[f.bookingType] || "Daftar";
}

function paymentPickerNote(required) {
  return required
    ? `<div class="field-hint" style="margin-bottom:12px">Setelah mengirim, kamu akan memilih metode pembayaran (QRIS / Transfer / Tunai) dan bisa langsung menyertakan bukti pembayarannya.</div>`
    : `<div class="field-hint" style="margin-bottom:12px">Metode pembayaran bisa dikonfirmasi belakangan bila diperlukan.</div>`;
}

async function render(container, { id: fid }) {
  container.innerHTML = `
    <div class="back-row"><button class="back-btn" data-nav="#/facilities">←</button></div>
    <div id="content" class="section">Memuat...</div>
  `;
  const content = document.getElementById("content");

  let facility;
  try {
    const data = await api(`/facilities/${fid}`);
    facility = data.facility;
    content.innerHTML = `
      <img class="detail-hero" style="border-radius:16px" src="${assetUrl(facility.image)}" onerror="this.src='https://images.unsplash.com/photo-1583225214464-9296029427aa?w=700'"/>
      <div style="margin-top:14px">
        <span class="tag">${escapeHtml(facility.category)}</span>
        <h2 style="margin-top:8px">${escapeHtml(facility.name)}</h2>
        ${facility.avgRating ? `<div class="stars">${stars(facility.avgRating)} <span style="color:var(--ink-soft);font-size:0.78rem">${facility.avgRating} (${facility.reviewCount} ulasan)</span></div>` : `<div style="font-size:0.78rem;color:var(--ink-soft)">Belum ada ulasan</div>`}
        <p style="margin-top:10px">${escapeHtml(facility.longDesc)}</p>
        <div class="card card-pad" style="background:var(--cream-200);border:none;margin:14px 0">
          <strong style="font-size:0.85rem">💰 ${escapeHtml(facility.priceInfo)}</strong>
        </div>
      </div>
      <div id="bookingSection"></div>
      <div class="section" style="padding:20px 0 0">
        <div class="section-head"><h3>Ulasan pendaftar</h3></div>
        <div id="reviewForm"></div>
        <div id="reviewList">${renderReviews(data.reviews)}</div>
      </div>
    `;
    renderBookingForm(facility);
    renderReviewForm(fid);
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Fasilitas tidak ditemukan.</div>`;
  }
}

function renderReviews(reviews) {
  if (!reviews.length) return `<div class="empty-state"><div class="e-icon">📝</div>Jadilah yang pertama memberi ulasan.</div>`;
  return reviews
    .map(
      (r) => `<div class="review-item">
        <div class="r-head"><span class="r-name">${escapeHtml(r.userName)}</span><span class="r-date">${formatDate(r.date)}</span></div>
        <div class="stars">${stars(r.rating)}</div>
        <p style="margin:4px 0 0;font-size:0.86rem">${escapeHtml(r.comment)}</p>
      </div>`
    )
    .join("");
}

function renderReviewForm(fid) {
  const wrap = document.getElementById("reviewForm");
  if (!isLoggedIn()) {
    wrap.innerHTML = `<div class="card card-pad" style="margin-bottom:14px"><a href="#/login">Masuk</a> untuk memberi ulasan.</div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="card card-pad" style="margin-bottom:14px">
      <div class="field">
        <label>Rating kamu</label>
        <select id="rvRating"><option value="5">★★★★★ Sangat baik</option><option value="4">★★★★ Baik</option><option value="3">★★★ Cukup</option><option value="2">★★ Kurang</option><option value="1">★ Buruk</option></select>
      </div>
      <div class="field"><label>Komentar</label><textarea id="rvComment" rows="2" placeholder="Bagikan pengalamanmu..."></textarea></div>
      <button class="btn btn-outline" id="submitReviewBtn">Kirim ulasan</button>
    </div>`;
  document.getElementById("submitReviewBtn").addEventListener("click", async () => {
    const rating = document.getElementById("rvRating").value;
    const comment = document.getElementById("rvComment").value.trim();
    if (!comment) return showToast("Tulis komentar dulu ya.");
    try {
      await api(`/facilities/${fid}/reviews`, { method: "POST", auth: true, body: { rating, comment } });
      showToast("Ulasan terkirim, makasih!");
      render(document.getElementById("app"), { id: fid });
    } catch (err) {
      showToast(err.message);
    }
  });
}

function renderBookingForm(f) {
  const wrap = document.getElementById("bookingSection");
  const loginNotice = !isLoggedIn()
    ? `<div class="card card-pad" style="background:#fbeecc;margin-bottom:12px"><strong>Perlu masuk dulu.</strong> Pendaftaran/booking mengharuskan kamu login supaya statusnya bisa dipantau. <a href="#/login">Masuk sekarang</a> atau <a href="#/register">daftar akun</a>.</div>`
    : "";

  let formHtml = "";
  if (f.bookingType === "wisata") {
    formHtml = `
      <div class="field"><label>Tanggal kunjungan</label><input type="date" id="bkDate" /></div>
      <div class="field"><label>Jumlah peserta</label><input type="number" id="bkQty" min="1" value="1" /></div>
      ${paymentPickerNote(true)}
      <button class="btn btn-primary" id="bkSubmit">Daftar &amp; Bayar</button>`;
  } else if (f.bookingType === "reguler") {
    formHtml = `
      <div class="field"><label>Jadwal yang diinginkan</label><input id="bkDate" placeholder="mis. Sabtu sore, atau sesuai jadwal tersedia" /></div>
      <div class="field"><label>Catatan (usia, pengalaman, dll)</label><textarea id="bkNotes" rows="2" placeholder="Ceritakan sedikit tentang dirimu"></textarea></div>
      ${f.id === "les-karawitan" ? `<div class="field-hint" style="margin-bottom:14px">Kelas karawitan masih gratis — cukup kirim pendaftaran, admin akan menghubungimu untuk jadwal.</div>` : paymentPickerNote(false)}
      <button class="btn btn-primary" id="bkSubmit">Kirim Pendaftaran</button>`;
  } else if (f.bookingType === "rental") {
    formHtml = `
      <div class="field"><label>Tanggal sewa</label><input type="date" id="bkDate" /></div>
      <div class="field"><label>Karakter / ukuran kostum</label><input id="bkNotes" placeholder="mis. Kostum Panji, ukuran M" /></div>
      ${paymentPickerNote(true)}
      <button class="btn btn-primary" id="bkSubmit">Ajukan Sewa</button>`;
  } else if (f.bookingType === "event") {
    formHtml = `
      <div class="field"><label>Jenis acara</label><input id="bkEventType" placeholder="mis. Pernikahan, Festival, Study Tour" /></div>
      <div class="field"><label>Tanggal acara</label><input type="date" id="bkDate" /></div>
      <div class="field"><label>Lokasi acara</label><input id="bkLocation" placeholder="Alamat lengkap lokasi acara" /></div>
      <div class="field"><label>Perkiraan jumlah tamu/peserta</label><input type="number" id="bkGuest" min="1" /></div>
      <div class="field"><label>Catatan tambahan</label><textarea id="bkNotes" rows="2" placeholder="Durasi, lakon yang diinginkan, dll"></textarea></div>
      <div class="field-hint" style="margin-bottom:14px">Tim kami akan meninjau permintaan ini dan menghubungimu untuk penawaran harga.</div>
      <button class="btn btn-primary" id="bkSubmit">Ajukan Permintaan</button>`;
  }

  wrap.innerHTML = `
    <div class="section" style="padding:16px 0 0">
      <div class="section-head"><h3>${bookingHeading(f)}</h3></div>
      ${loginNotice}
      <div class="card card-pad" id="bookingFormCard" style="${!isLoggedIn() ? "opacity:0.5;pointer-events:none" : ""}">
        ${formHtml}
      </div>
      <div id="bookingResult"></div>
    </div>`;

  const submitBtn = document.getElementById("bkSubmit");
  if (submitBtn) submitBtn.addEventListener("click", () => submitBooking(f));
}

async function submitBooking(f) {
  if (!requireLoginOrRedirect()) return;
  const val = (id) => (document.getElementById(id) ? document.getElementById(id).value : null);
  const needsPaymentNow = f.bookingType === "wisata" || f.bookingType === "rental";
  const body = {
    facilityId: f.id,
    date: val("bkDate"),
    notes: val("bkNotes") || "",
    eventType: val("bkEventType"),
    location: val("bkLocation"),
    guestCount: val("bkGuest"),
    // Payment method is picked afterwards via the shared payment widget; send a
    // placeholder so the backend accepts the booking, updated on first proof/method pick.
    paymentMethod: needsPaymentNow ? "qris" : null,
  };
  try {
    const { booking } = await api("/bookings", { method: "POST", auth: true, body });
    showToast("Permintaan terkirim!");
    renderBookingResult(booking);
    document.getElementById("bookingFormCard").style.display = "none";
  } catch (err) {
    showToast(err.message);
  }
}

function renderBookingResult(booking) {
  const resultWrap = document.getElementById("bookingResult");
  if (booking.status === "menunggu_pembayaran") {
    resultWrap.innerHTML = `
      <div class="card card-pad">
        <span class="status-chip wait">Menunggu Pembayaran</span>
        <p style="margin-top:10px">Pilih metode pembayaran, lalu unggah bukti pembayaranmu.</p>
      </div>
      ${renderPaymentBlock({ kind: "booking", id: booking.id, amount: booking.amount })}
    `;
    window.addEventListener("payment:done", function handler() {
      resultWrap.innerHTML = `<div class="card card-pad"><span class="status-chip wait">Menunggu Verifikasi</span><p style="margin-top:10px">Terima kasih! Admin akan memverifikasi pembayaranmu dalam 1x24 jam.</p></div>`;
      window.removeEventListener("payment:done", handler);
    });
  } else if (booking.status === "menunggu_kedatangan") {
    resultWrap.innerHTML = `<div class="card card-pad"><span class="status-chip wait">Menunggu Kedatangan</span><p style="margin-top:10px">Silakan datang sesuai jadwal dan bayar langsung di lokasi. Sampai jumpa di sanggar!</p></div>`;
  } else {
    resultWrap.innerHTML = `<div class="card card-pad"><span class="status-chip wait">Menunggu Konfirmasi</span><p style="margin-top:10px">Permintaanmu sudah kami terima. Pantau statusnya di halaman <a href="#/my-orders">Pesanan Saya</a>, admin akan menghubungimu melalui email/WhatsApp.</p></div>`;
  }
}

export default { nav: "facilities", render };
