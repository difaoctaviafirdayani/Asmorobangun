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

## Upload foto & file (admin)

Tidak ada lagi menu "Pustaka Media". Setiap form di dashboard admin punya tombol **Pilih foto**
sendiri: pilih file, langsung terunggah ke server (`POST /api/uploads/image`), pratinjau tampil,
lalu klik **Simpan**. Berlaku untuk Kelola Kelas/Fasilitas (gambar + QRIS), Kelola Topeng,
Kelola Galeri, Kelola Artikel, Kelola Pengumuman, dan Pengaturan Pembayaran (QRIS umum).
Komponennya ada di `frontend-admin/js/imageField.js`.

## Pembayaran (QRIS / Transfer / Tunai)

Tanpa verifikasi nomor HP/OTP. Setelah memilih metode, pembeli langsung melihat:

- **QRIS** : gambar QRIS langsung tampil, lalu wajib unggah bukti pembayaran.
- **Transfer Bank** : nomor rekening langsung tampil, lalu wajib unggah bukti pembayaran.
- **Tunai** : cukup tekan "Pilih Bayar Tunai" (`POST .../cash`), tanpa bukti pembayaran.

Metode yang tampil, catatan transfer/tunai, dan gambar QRIS per layanan diatur admin di
**Kelola Kelas/Fasilitas**. Rekening bank dan QRIS umum (dipakai pesanan topeng) diatur di
**Pengaturan Pembayaran**.

## Font & ikon

- Judul **ASMOROBANGUN** di beranda memakai **Upakarti** (`frontend-app/fonts/Upakarti.ttf`, file font
  harus dipasang sendiri). Heading memakai **Margarine**, teks isi memakai **Poppins** (keduanya dimuat
  dari Google Fonts, jadi perlu internet).
- Semua emoji diganti ikon SVG (Material Design Icons) lewat `js/icons.js` di masing-masing frontend.

## Catatan teknis

- Database masih file JSON (`backend/data/db.json`) — cocok untuk prototipe/skripsi, tapi ganti
  ke database sungguhan (PostgreSQL/MySQL/MongoDB) sebelum dipakai produksi banyak pengguna.
- `adm-zip` masih tercantum di `package.json` tetapi sudah tidak dipakai (fitur upload .zip dihapus); boleh dicabut dengan `npm uninstall adm-zip`.
