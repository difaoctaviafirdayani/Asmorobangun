const express = require("express");
const { readDB } = require("../db");

const router = express.Router();

const SYSTEM_CONTEXT = `Kamu adalah "Asisten Asmorobangun", asisten virtual di website Sanggar Asmorobangun
(Wayang Topeng Malangan) di Dusun Kedungmonggo, Desa Karangpandan, Kec. Pakisaji, Kab. Malang.
Jawab singkat, ramah, dan dalam Bahasa Indonesia. Bantu pengunjung soal: jadwal & cara daftar kelas
tari/karawitan, kelas tari wisata (Rp 15.000/sekali datang), sewa kostum, panggilan tari untuk acara,
kunjungan edukasi, cara pesan topeng, metode pembayaran (QRIS, transfer, tunai), dan info budaya
Topeng Malangan. Jika tidak yakin, arahkan pengguna untuk bertanya di forum diskusi atau menghubungi
admin sanggar.`;

// Rule-based fallback so the assistant still works with zero configuration / no API key.
function ruleBasedAnswer(message) {
  const m = message.toLowerCase();
  const db = readDB();

  if (/(halo|hai|hi|pagi|siang|sore|malam)/.test(m) && m.length < 20) {
    return "Halo! Selamat datang di Sanggar Asmorobangun. Ada yang bisa dibantu seputar kelas tari, karawitan, sewa kostum, topeng, atau panggilan pentas?";
  }
  if (/(lokasi|alamat|dimana|di mana|rute|arah)/.test(m)) {
    return "Sanggar kami berada di Dusun Kedungmonggo, Desa Karangpandan, Kecamatan Pakisaji, Kabupaten Malang — sekitar 30-40 menit berkendara dari Alun-Alun Kota Malang. Cek menu 'Lokasi' di halaman utama untuk peta lengkap.";
  }
  if (/(harga|biaya|bayar|tarif).*(tari|wisata|kelas)/.test(m) || /kelas.*(harga|biaya)/.test(m)) {
    return "Kelas Tari Wisata (sekali datang) Rp 15.000/sesi. Untuk Les Tari Reguler (menetap) biaya SPP menyesuaikan kelompok usia, silakan hubungi admin lewat halaman fasilitas untuk rincian.";
  }
  if (/karawitan/.test(m)) {
    return "Kelas Karawitan masih gratis untuk saat ini! Kamu akan belajar langsung dari nayaga sanggar mulai dari mengenal instrumen gamelan sampai mengiringi pentas. Daftar lewat halaman Fasilitas > Les Karawitan.";
  }
  if (/(sewa|rental).*(kostum|baju)/.test(m)) {
    return "Sewa kostum mulai Rp 75.000/set/hari tergantung karakter & kelengkapan. Disarankan pesan minimal H-3 sebelum tanggal pemakaian ya.";
  }
  if (/(panggil|undang|manggung|pentas|acara|nikah|hajatan)/.test(m)) {
    return "Untuk panggilan pentas (pernikahan, festival, acara instansi, dll), silakan isi form 'Panggilan Tari' di halaman Fasilitas. Tim kami akan meninjau lalu memberi penawaran sesuai jumlah penari & lokasi.";
  }
  if (/(beli|pesan|order).*(topeng)/.test(m) || /topeng.*(beli|pesan|harga)/.test(m)) {
    const names = db.topeng.map((t) => t.name).join(", ");
    return `Kami punya beberapa topeng siap jual: ${names}. Kamu juga bisa request nama/desain custom saat memesan lewat halaman Topeng, lalu lanjut chat dengan admin di sana.`;
  }
  if (/(bayar|pembayaran|qris|transfer|tunai|cash)/.test(m)) {
    return "Pembayaran non-tunai bisa lewat QRIS (kode QR muncul otomatis) atau transfer bank — setelah itu unggah bukti bayar di halaman booking kamu. Bayar tunai juga bisa langsung di lokasi.";
  }
  if (/(daftar|register|masuk|login)/.test(m)) {
    return "Untuk mendaftar kelas, memesan topeng, atau membuat permintaan panggilan pentas, kamu perlu login/daftar akun dulu ya — supaya pesananmu tersimpan dan bisa dipantau statusnya.";
  }
  if (/(sejarah|asal|berdiri)/.test(m)) {
    return "Sanggar Asmorobangun dirintis sejak akhir 1970-an oleh maestro topeng Mbah Karimun, kini diteruskan cucunya, Tri Handoyo. Baca selengkapnya di halaman Artikel kami!";
  }
  return "Terima kasih sudah bertanya! Untuk pertanyaan ini, coba cek halaman Forum Diskusi atau Fasilitas — kalau masih belum ketemu jawabannya, silakan hubungi admin sanggar langsung ya.";
}

router.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Pesan tidak boleh kosong." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({ reply: ruleBasedAnswer(message), mode: "rule-based" });
  }

  try {
    const messages = [...(Array.isArray(history) ? history : []), { role: "user", content: message }];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system: SYSTEM_CONTEXT,
        messages,
      }),
    });
    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
    if (!text) throw new Error("empty response");
    res.json({ reply: text, mode: "claude-api" });
  } catch (err) {
    res.json({ reply: ruleBasedAnswer(message), mode: "rule-based-fallback" });
  }
});

module.exports = router;
