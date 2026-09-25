const express = require("express");
const QRCode = require("qrcode");
const { nanoid } = require("nanoid");
const { readDB, update } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { makeUploader } = require("../upload");

const router = express.Router();
const uploadProof = makeUploader("payment_proof");

const VALID_PAYMENT_METHODS = ["qris", "transfer", "cash"];

// POST /api/bookings  -- create a booking / event request (requires login, per revision #1)
router.post("/", requireAuth, async (req, res) => {
  const { facilityId, date, notes, paymentMethod, eventType, location, guestCount, amount } = req.body;
  const db = readDB();
  const facility = db.facilities.find((f) => f.id === facilityId);
  if (!facility) return res.status(400).json({ error: "Fasilitas tidak valid." });

  const method = paymentMethod && VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : null;
  // Event-type bookings (panggilan tari / kunjungan edukasi) don't need payment up front - they go
  // through an admin review + quote process instead.
  const needsPaymentNow = facility.bookingType === "wisata" || facility.bookingType === "rental";

  if (needsPaymentNow && !method) {
    return res.status(400).json({ error: "Silakan pilih metode pembayaran." });
  }

  const booking = {
    id: `bk-${nanoid(8)}`,
    facilityId,
    facilityName: facility.name,
    bookingType: facility.bookingType,
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    date: date || null,
    notes: notes || "",
    eventType: eventType || null,
    location: location || null,
    guestCount: guestCount || null,
    paymentMethod: method,
    amount: amount || facility.price || null,
    proofFile: null,
    status: needsPaymentNow ? (method === "cash" ? "menunggu_kedatangan" : "menunggu_pembayaran") : "menunggu_konfirmasi_admin",
    createdAt: new Date().toISOString(),
  };

  await update((data) => data.bookings.push(booking));
  res.status(201).json({ booking });
});

// GET /api/bookings/:id/qris -> returns a QRIS-style QR code (PNG data URL) for a booking
router.get("/:id/qris", requireAuth, async (req, res) => {
  const db = readDB();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan." });
  if (booking.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Tidak diizinkan." });
  }
  const payload = `ASMOROBANGUN|BOOKING:${booking.id}|NOMINAL:${booking.amount || 0}|SANGGAR ASMOROBANGUN PAKISAJI`;
  try {
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
    res.json({ qris: dataUrl, amount: booking.amount, note: "QRIS simulasi untuk keperluan demo/prototipe." });
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat QRIS." });
  }
});

// POST /api/bookings/:id/proof -- upload bukti transfer/qris (multipart field: proof)
router.post("/:id/proof", requireAuth, uploadProof.single("proof"), async (req, res) => {
  const db = readDB();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan." });
  if (booking.userId !== req.user.id) return res.status(403).json({ error: "Tidak diizinkan." });
  if (!req.file) return res.status(400).json({ error: "File bukti pembayaran wajib diunggah." });

  const fileUrl = `/uploads/payment_proof/${req.file.filename}`;
  await update((data) => {
    const b = data.bookings.find((x) => x.id === req.params.id);
    b.proofFile = fileUrl;
    b.status = "menunggu_verifikasi";
  });
  res.json({ message: "Bukti pembayaran berhasil diunggah, menunggu verifikasi admin.", proofFile: fileUrl });
});

// GET /api/bookings/mine
router.get("/mine", requireAuth, (req, res) => {
  const db = readDB();
  const mine = db.bookings
    .filter((b) => b.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ bookings: mine });
});

// ---- Admin ----
router.get("/", requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  res.json({ bookings: [...db.bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = [
    "menunggu_pembayaran",
    "menunggu_verifikasi",
    "menunggu_kedatangan",
    "menunggu_konfirmasi_admin",
    "dikonfirmasi",
    "ditolak",
    "selesai",
  ];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Status tidak valid." });
  const db = readDB();
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan." });
  await update((data) => {
    data.bookings.find((b) => b.id === req.params.id).status = status;
  });
  res.json({ message: "Status booking diperbarui." });
});

module.exports = router;
