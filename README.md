# Asmorobangun — Website Sanggar Wayang Topeng Malangan

Struktur proyek:
```
backend/           Express API + database file JSON (data/db.json)
frontend-app/       Aplikasi untuk pengunjung — SPA murni JS, HANYA 1 file .html (index.html shell)
frontend-admin/      Dashboard admin — SPA murni JS, HANYA 1 file .html (index.html shell)
```

Semua halaman di `frontend-app` dan `frontend-admin` di-render lewat JavaScript (hash router +
komponen JS di `js/pages/*.js`) — tidak ada lagi file `.html` terpisah per halaman, sesuai
permintaan "tidak boleh pakai HTML per halaman".

## Menjalankan

```bash
cd backend
npm install
npm start
```

Backend jalan di `http://localhost:4000`. Backend ini juga otomatis melayani kedua frontend:
- Situs pengunjung: `http://localhost:4000/app`
- Dashboard admin: `http://localhost:4000/admin`

(Atau kamu bisa buka `frontend-app/index.html` / `frontend-admin/index.html` langsung dari
file explorer / live-server terpisah — keduanya sudah diset untuk memanggil API ke
`http://localhost:4000/api`. Kalau mau ganti alamat API, set `window.__API_BASE__` sebelum
`main.js` di-load, atau edit `API_BASE` di `js/api.js`.)

## Login default

| Peran | Email | Password |
|---|---|---|
| Admin | admin@asmorobangun.id | (lihat/​reset lewat `backend/data/db.json`, password sudah di-hash — buat akun baru lewat halaman Daftar lalu ubah `role` jadi `"admin"` di db.json bila perlu) |

## Fitur baru sesuai revisi

1. **Galeri sanggar tampil semua, tanpa login**, digeser horizontal (carousel) di beranda + ada
   halaman "Lihat Semua" (`#/gallery`) berupa grid + lightbox.
2. **AI ("Asisten Topeng") hanya muncul di bagian Topeng** (katalog, detail, chat pesanan) —
   di halaman lain tombol AI tidak dipasang sama sekali. Di dalam topik topeng, AI menjawab
   bebas/tanpa batas (sejarah, tokoh, bahan, perawatan, katalog, dll).
3. **Pengumuman ditampilkan seperti berita** (kartu dengan gambar, judul, tanggal, ringkasan),
   bukan lagi bulatan status ala WhatsApp.
4. **Admin: filter pakai dropdown** (bukan tab) di halaman Pendaftar & Booking dan Pesanan Topeng.
5. **Palet warna** dirapikan lebih condong coklat kayu tua & krem sawo matang (lihat variabel CSS
   `--wood-*` dan `--cream-*` di `frontend-app/css/style.css` / `frontend-admin/css/admin.css`).
6. **Dashboard admin responsif**: sidebar jadi drawer/hamburger di HP & tablet sempit, dan
   berubah jadi sidebar tetap begitu layar ≥900px (tablet lanskap/laptop).

## Manajemen gambar (Pustaka Media)

Menu admin **Pustaka Media** (`#/pustaka-media`) memungkinkan:
- Unggah satu gambar, atau
- Unggah **file `.zip` berisi banyak gambar sekaligus** — server otomatis mengekstrak semua
  gambar di dalamnya ke pustaka media.

Gambar yang sudah ada di pustaka bisa langsung dipakai di menu Kelola Topeng, Kelola Galeri,
Kelola Artikel, dan Kelola Pengumuman lewat tombol "Pilih dari Pustaka Media" — jadi kalau
kalian sering ganti-ganti foto, cukup unggah zip baru lalu pilih ulang di masing-masing item.

> Catatan: beberapa data contoh (seed) di `db.json` masih menunjuk ke nama file gambar lama yang
> belum ada filenya (peninggalan data awal proyek) — tinggal unggah gambar penggantinya lewat
> Pustaka Media lalu pilih ulang di masing-masing halaman kelola.

## Pembayaran (QRIS / Transfer / Tunai)

- Untuk **QRIS** dan **Transfer Bank**, pembeli wajib memverifikasi nomor HP (kirim & masukkan
  kode OTP) dulu sebelum kode QRIS / nomor rekening ditampilkan. Karena prototipe ini belum
  terhubung ke gateway SMS sungguhan, kode OTP ditampilkan langsung lewat notifikasi (toast) dan
  dicatat di log server — tinggal sambungkan ke provider SMS/WhatsApp API sungguhan untuk
  produksi (lihat `backend/src/routes/payments.routes.js`).
- Ketiga metode (Tunai, QRIS, Transfer) sama-sama bisa menyertakan **unggah bukti pembayaran**.
- Info rekening bank & nama merchant QRIS bisa diubah admin di menu **Pengaturan Pembayaran**.

## Catatan teknis

- Database masih file JSON (`backend/data/db.json`) — cocok untuk prototipe/skripsi, tapi ganti
  ke database sungguhan (PostgreSQL/MySQL/MongoDB) sebelum dipakai produksi banyak pengguna.
- Dependensi baru: `adm-zip` (ekstrak file .zip di server, dipakai fitur Pustaka Media).
