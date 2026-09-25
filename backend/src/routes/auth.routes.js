const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { readDB, update } = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, username, email, password, phone } = req.body;
  const displayName = name || username;
  if (!displayName || !email || !password) {
    return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter." });
  }
  const db = readDB();
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Email sudah terdaftar. Silakan login." });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: `u-${nanoid(8)}`,
    name: displayName,
    email,
    phone: phone || "",
    password: hashed,
    role: "member",
    createdAt: new Date().toISOString(),
  };
  await update((data) => {
    data.users.push(user);
  });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib diisi." });
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Email atau password salah." });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Email atau password salah." });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
  res.json({ user: publicUser(user) });
});

module.exports = router;
