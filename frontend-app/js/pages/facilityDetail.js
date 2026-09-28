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
    // Metode pembayaran dipilih setelahnya lewat widget pembayaran
    paymentMethod: needsPaymentNow ? "qris" : null,
  };
  try {
    const { booking } = await api("/bookings", { method: "POST", auth: true, body });
    showToast("Permintaan terkirim!");
    renderBookingResult(booking, f);
    document.getElementById("bookingFormCard").style.display = "none";
  } catch (err) {
    showToast(err.message);
  }
}

function renderBookingResult(booking, f) {
  const resultWrap = document.getElementById("bookingResult");
  if (booking.status === "menunggu_pembayaran") {
    resultWrap.innerHTML = `
      <div class="card card-pad">
        <span class="status-chip wait">Menunggu Pembayaran</span>
        <p style="margin-top:10px">Pilih metode pembayaran, lalu unggah bukti pembayaranmu.</p>
      </div>
      ${renderPaymentBlock({ kind: "booking", id: booking.id, amount: booking.amount, methods: f.paymentMethods })}
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