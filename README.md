# Website Sanggar Asmorobangun

Website untuk Sanggar Wayang Topeng Malangan "Asmorobangun" (Dusun Kedungmonggo,
Pakisaji, Kab. Malang) — dibangun sesuai desain Figma tim + revisi yang diminta.

Struktur proyek **1 backend + 2 frontend terpisah**:

```
asmorobangun/
├── backend/          → Express API + "database" (JSON file, gampang diganti ke DB asli nanti)
├── frontend-app/      → Situs untuk PENGGUNA (mobile-app style, kayak WhatsApp)
└── frontend-admin/    → Dashboard ADMIN (desktop, sidebar)
```

Backend dipakai bersama oleh kedua frontend — jadi kalau admin menambah artikel/kelas/topeng,
otomatis langsung muncul di sisi pengguna karena sama-sama baca dari 1 backend yang sama.

---

## 1. Fitur yang sudah dibuat

**Revisi yang kamu minta — semua sudah dikerjakan:**
1. ✅ Wajib login untuk mendaftar/booking fasilitas apa pun (biar "mengikat").
2. ✅ Section Artikel & Berita sendiri (ada 4 artikel awal, hasil riset fakta valid soal sejarah
   Sanggar Asmorobangun — bisa kamu edit/tambah lewat dashboard admin).
3. ✅ Fasilitas lengkap 6 jenis: Panggilan Tari (pentas), Kunjungan Edukasi, Kelas Tari Wisata
   (Rp 15.000/sekali datang), Les Tari Reguler (menetap), Les Karawitan, Sewa Kostum.
4. ✅ Review/ulasan ditampilkan langsung di halaman detail tiap fasilitas.
5. ✅ Pembayaran non-tunai: pilih QRIS → muncul kode QR otomatis (asli di-generate, bukan gambar
   statis) + form upload bukti transfer. Bisa juga pilih Transfer Bank atau Tunai di lokasi.
6. ✅ Gambar di halaman detail (termasuk foto proses pembuatan topeng) memakai `object-fit: cover`
   supaya tidak gepeng/melar — tinggal ganti file gambarnya saja di `frontend-app/assets/`.
7. ✅ FAQ diganti Forum Diskusi (bisa buat thread, balas, kategori), dengan tombol "Diskusi Baru"
   mengambang di bawah layar seperti aplikasi pada umumnya.
8. ✅ Beranda dibuat mirip WhatsApp: search bar di bawah nama "asmorobangun" (klik → buka menu
   fitur lengkap + pencarian global), "status" pengumuman di baris atas, daftar layanan berupa
   chat-list yang tinggal diklik (jadi tidak perlu banyak scroll).
9. ✅ Toko topeng: 5 topeng contoh siap jual, form pesan dengan **request nama & desain custom**,
   lanjut ke halaman chat in-app dengan admin + pembayaran.
10. ✅ Panggilan tari untuk acara (pernikahan dll) dan kunjungan edukasi: pakai **form permintaan
    terstruktur** (jenis acara, tanggal, lokasi, jumlah tamu) — bukan cuma chat simpel — supaya
    admin bisa menindaklanjuti dengan jelas, ditambah tombol WhatsApp langsung sebagai alternatif cepat.
11. ✅ Chatbot AI ("Asisten Asmorobangun") — tombol mengambang di semua halaman, bisa jawab soal
    kelas, harga, lokasi, cara pesan, dll. Kalau kamu isi API key Claude asli di `.env`, jawabannya
    memakai Claude betulan; kalau tidak diisi, otomatis pakai jawaban rule-based bawaan (tetap
    berfungsi, gratis, tanpa setup apa pun).

**Fitur tambahan yang aku sisipkan sendiri** (biar sesuai kata dosen "fitur kurang banyak"),
supaya kamu tahu persis apa yang ditambahkan saat presentasi:

- **Peta lokasi interaktif** (OpenStreetMap, gratis tanpa API key) + tombol buka Google Maps &
  WhatsApp admin langsung dari beranda.
- **Global search** (klik search bar) yang mencari ke artikel, fasilitas, topeng, dan forum sekaligus.
- **Galeri foto kegiatan** sanggar, bisa dikelola admin.
- **Halaman "Edukasi Budaya"**: linimasa sejarah sanggar + filosofi warna topeng, bisa diedit admin
  (isinya sudah aku isi dengan riset fakta yang valid).
- **"Pesanan Saya"**: riwayat semua booking kelas & pesanan topeng pengguna, dengan status berwarna
  (menunggu bayar / menunggu verifikasi / dikonfirmasi / ditolak, dst).
- **Dashboard admin lengkap**: statistik (total pendaftar, kelas terpopuler, menunggu verifikasi
  pembayaran, dll), tabel Data Pendaftar dengan filter tab, dan halaman kelola untuk tiap jenis
  konten (kelas, topeng, galeri, edukasi budaya, artikel, pengumuman, forum).
- **Sistem ulasan bintang** rata-rata per fasilitas, tampil di daftar & detail fasilitas.
- **Chat-thread per pesanan topeng** (bukan cuma satu kali form) — pembeli & admin bisa
  gantian kirim pesan di halaman yang sama sampai deal.

---

## 2. Yang perlu kamu tahu (batasan prototipe — sampaikan juga ke dosen)

Supaya jujur dan tidak menjanjikan lebih dari yang ada:

- **Database**: pakai file JSON (`backend/data/db.json`) supaya gampang dijalankan tanpa install
  database tambahan. Ini cocok untuk demo/skripsi/tugas kuliah, tapi **bukan untuk production
  sungguhan** (kalau dipakai banyak orang sekaligus sebaiknya diganti ke PostgreSQL/MySQL/MongoDB —
  strukturnya sudah rapi jadi tinggal ganti isi `backend/src/db.js`).
- **QRIS**: kode QR yang muncul itu **QR asli** (di-generate library `qrcode`), tapi isinya data
  simulasi, bukan tersambung ke rekening/merchant sungguhan. Untuk QRIS asli yang bisa dipakai
  bayar betulan, perlu daftar ke payment gateway (mis. Midtrans, Xendit) — nanti tinggal ganti
  logic di `backend/src/routes/bookings.routes.js` bagian `/qris`.
- **Gambar**: banyak gambar masih placeholder (fallback otomatis ke foto dari Unsplash kalau file
  lokal belum ada). Tinggal taruh foto asli sanggar di folder `frontend-app/assets/` dengan nama
  file yang sama (lihat daftar nama file di `backend/data/db.json`, field `"image"`).
- **Nomor WhatsApp admin**: masih pakai nomor contoh `6281234567890`. Cari & ganti semua kemunculan
  nomor itu di `frontend-app/` dengan nomor asli sanggar.

---

## 3. Cara menjalankan di **komputer kamu** (step-by-step VS Code terminal)

### Langkah 1 — Ekstrak & buka folder
1. Extract file zip `asmorobangun.zip` ke folder mana saja, misalnya Desktop.
2. Buka **Visual Studio Code** → `File > Open Folder...` → pilih folder `asmorobangun` hasil extract.

### Langkah 2 — Pastikan Node.js sudah terinstall
Buka terminal di VS Code (menu `Terminal > New Terminal`), lalu ketik:
```
node -v
```
Kalau muncul versi (misal `v18.x.x` atau lebih baru), lanjut ke langkah 3.
Kalau muncul error "command not found", install dulu Node.js dari https://nodejs.org (pilih versi LTS).

### Langkah 3 — Install dependency backend
Di terminal VS Code, ketik:
```
cd backend
npm install
```
Tunggu sampai selesai (muncul tulisan `added XXX packages`).

### Langkah 4 (opsional) — Aktifkan AI asli
Kalau mau chatbot pakai Claude API sungguhan:
```
cp .env.example .env
```
Lalu buka file `.env` yang baru dibuat, isi `ANTHROPIC_API_KEY=` dengan API key dari
https://console.anthropic.com. **Kalau dilewati saja, chatbot tetap berfungsi** (mode rule-based).

### Langkah 5 — Jalankan backend
Masih di dalam folder `backend`, ketik:
```
npm start
```
Kalau berhasil akan muncul tulisan:
```
Asmorobangun backend running on http://localhost:4000
```
**Biarkan terminal ini tetap terbuka/berjalan** selama kamu memakai website (jangan ditutup).

### Langkah 6 — Buka website PENGGUNA
Buka File Explorer (atau tab baru VS Code), lalu buka file ini langsung di browser
(Chrome/Edge, tinggal double click filenya atau drag ke browser):
```
frontend-app/index.html
```
Atau, kalau backend sedang jalan, kamu juga bisa buka lewat:
```
http://localhost:4000/app/index.html
```

### Langkah 7 — Buka dashboard ADMIN
Buka juga file ini di tab/browser terpisah:
```
frontend-admin/login.html
```
Atau lewat backend:
```
http://localhost:4000/admin/login.html
```
Login pakai akun admin bawaan:
- **Email**: `admin@asmorobangun.id`
- **Password**: `admin123`

> Kalau nanti mau ganti password admin, paling gampang lewat kode: buka
> `backend/data/db.json`, cari bagian `users`, atau tambah user baru lewat halaman
> register pengguna lalu ubah manual field `"role"` user itu jadi `"admin"` di db.json.

### Cara berhenti / menjalankan ulang
- Untuk berhenti: klik di terminal yang menjalankan `npm start`, tekan `Ctrl + C`.
- Untuk jalan lagi besok-besok: buka VS Code → buka terminal → `cd backend` → `npm start` lagi.
- Data yang sudah diinput (pendaftaran, pesanan, dst) **tersimpan otomatis** di
  `backend/data/db.json`, tidak hilang walau server dimatikan.

### Kalau mau reset data ke kondisi awal
Data contoh awal (seed) ada backup-nya. Kalau db.json berantakan/mau reset:
1. Hentikan server (`Ctrl+C`).
2. Ganti isi `backend/data/db.json` dengan versi awal (bisa minta ulang ke saya, atau backup
   dulu file ini sebelum banyak coba-coba supaya bisa dikembalikan).

---

## 4. Struktur folder backend (kalau mau dikembangkan lagi)

```
backend/
├── server.js              → entry point, daftar semua route
├── data/db.json            → "database" (edit manual boleh, tapi hati-hati format JSON)
├── uploads/                → tempat file bukti pembayaran hasil upload user
└── src/
    ├── db.js               → helper baca/tulis db.json
    ├── upload.js           → konfigurasi upload file (multer)
    ├── middleware/auth.js  → cek login (JWT) & cek admin
    └── routes/
        ├── auth.routes.js          (register, login)
        ├── articles.routes.js      (artikel/berita)
        ├── facilities.routes.js    (6 fasilitas + ulasan)
        ├── bookings.routes.js      (booking + QRIS + upload bukti)
        ├── topeng.routes.js        (katalog topeng + pesanan + chat)
        ├── forum.routes.js         (forum diskusi)
        ├── announcements.routes.js (pengumuman/"status")
        ├── gallery.routes.js       (galeri foto)
        ├── culture.routes.js       (linimasa edukasi budaya)
        ├── search.routes.js        (pencarian global)
        ├── ai.routes.js            (chatbot AI)
        └── admin.routes.js         (statistik dashboard admin)
```

Kalau butuh bantuan lanjut (misalnya ganti ke database sungguhan, deploy ke internet supaya
bisa diakses dari HP orang lain / hosting, atau tambah fitur baru lagi), tinggal bilang saja.
