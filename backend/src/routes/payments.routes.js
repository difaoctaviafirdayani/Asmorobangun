const express = require("express");
const { readDB, update } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// In-memory OTP store (demo/prototype only - swap for a real SMS gateway +
// persistent store in production). Keyed by userId.
const otpStore = new Map(); // userId -> { phone, code, expiresAt }

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// GET /api/payments/settings -- bank + QRIS merchant info shown once a
// buyer's phone number has been verified.
router.get("/settings", requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({
    settings: db.paymentSettings,
    phoneVerified: !!(user && user.phoneVerified),
    verifiedPhone: user ? user.verifiedPhone : null,
  });
});

// PATCH /api/payments/settings -- admin edits bank account / QRIS merchant name
router.patch("/settings", requireAuth, requireAdmin, async (req, res) => {
  const { bankName, accountNumber, accountName, qrisMerchantName, whatsapp } = req.body;
  await update((data) => {
    Object.assign(data.paymentSettings, {
      ...(bankName !== undefined && { bankName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(accountName !== undefined && { accountName }),
      ...(qrisMerchantName !== undefined && { qrisMerchantName }),
      ...(whatsapp !== undefined && { whatsapp }),
    });
  });
  res.json({ message: "Pengaturan pembayaran diperbarui." });
});

// POST /api/payments/phone/send-otp { phone } -- required before QRIS/transfer
// details (and the bank account number) are revealed to a buyer.
router.post("/phone/send-otp", requireAuth, (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return res.status(400).json({ error: "Nomor HP tidak valid." });
  }
  const code = genCode();
  otpStore.set(req.user.id, { phone, code, expiresAt: Date.now() + 5 * 60 * 1000 });
  // No real SMS gateway is wired up in this prototype, so the code is
  // logged server-side and echoed back as devCode for local testing/demo.
  console.log(`[OTP] kirim kode ${code} ke ${phone} untuk user ${req.user.id}`);
  res.json({ message: `Kode verifikasi telah dikirim ke ${phone}.`, devCode: code });
});

// POST /api/payments/phone/verify-otp { phone, code }
router.post("/phone/verify-otp", requireAuth, async (req, res) => {
  const { phone, code } = req.body;
  const entry = otpStore.get(req.user.id);
  if (!entry || entry.phone !== phone) {
    return res.status(400).json({ error: "Belum ada kode terkirim untuk nomor ini. Kirim ulang kode." });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(req.user.id);
    return res.status(400).json({ error: "Kode verifikasi sudah kedaluwarsa. Kirim ulang kode." });
  }
  if (String(code).trim() !== entry.code) {
    return res.status(400).json({ error: "Kode verifikasi salah." });
  }
  otpStore.delete(req.user.id);
  await update((data) => {
    const u = data.users.find((x) => x.id === req.user.id);
    if (u) {
      u.phoneVerified = true;
      u.verifiedPhone = phone;
    }
  });
  res.json({ message: "Nomor HP berhasil diverifikasi.", verifiedPhone: phone });
});

module.exports = router;
