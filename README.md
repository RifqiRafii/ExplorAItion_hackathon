# ⚡ WarungCopilot - Smart Restock & Pembukuan AI

> **Asisten Keuangan & Inventaris Cerdas Khusus Pemilik Warung & UMKM Sembako/Ritel**  
> *Zero Learning Curve • Mengikis "Ilusi Laba" • Integrasi Chat WhatsApp & Nota Cepat*

---

## 📌 Tentang Aplikasi

Banyak pemilik warung kelontong dan UMKM mengalami fenomena **"Ilusi Laba"**—merasa dagangan sangat laris setiap hari, namun saat ingin kulakan uang kas di laci kasir selalu habis. 

Setelah ditelusuri, ada dua penyebab utama:
1. **Uang Tertahan di Stok Berlebih (*Overstock*)**: Membeli barang terlalu banyak tanpa memantau perputaran riil.
2. **Piutang/Bon Pelanggan Macet**: Buku kasbon fisik hilang, sobek, atau pedagang merasa "sungkan" menagih utang ke tetangga dan pelanggan tetap.
3. **Form Akuntansi Terlalu Rumit**: Aplikasi pembukuan konvensional menuntut pemahaman debet/kredit dan terlalu banyak isian form yang tidak praktis di lapangan.

**WarungCopilot** hadir sebagai solusi berbasis AI yang menyederhanakan pembukuan:
- **Cukup Chat Bahasa Sehari-hari**: Ketik *"Laku 3 sak beras, 1 sak diutang Bu Siti"*, AI otomatis membagi transaksi menjadi uang kas, memotong stok beras, dan mencatat buku bon piutang.
- **Jalur Cepat Transaksi Manual (*Quick-Tap Entry*)**: Form kilat (< 10 detik) untuk kasir saat warung sedang antre panjang/jam sibuk.
- **Deteksi Foto Nota**: Memotret nota belanja kulakan dan otomatis menambah stok barang serta mencatat kas keluar.
- **Proactive Smart Actions**:
  - Peringatan stok kritis dan pembuatan draf pesanan ke agen pemasok.
  - Pengingat piutang jatuh tempo dengan tombol **"Tagih via WhatsApp"** yang langsung menyiapkan pesan penagihan yang santun, ramah, dan tidak menyinggung pelanggan.

---

## 🚀 Fitur Utama

- 💵 **High-Contrast Mobile Dashboard**: Tampilan kartu metrik dengan angka besar dan warna kontras tinggi (Kas Hijau, Piutang Oranye, Stok Kritis Merah) yang nyaman dibaca di bawah pencahayaan toko.
- ⚡ **Dual Input Mode**: Fleksibilitas memilih antara dialog santai bersama AI Copilot atau form manual kilat saat toko ramai.
- 📦 **Manajemen Stok Real-time**: Indikator stok aman vs kritis dengan peringatan ambang batas minimum.
- 📖 **Buku Kasbon & Piutang Pintar**: Pelacakan otomatis hari jatuh tempo utang pelanggan.
- 💬 **Integrasi WhatsApp**: Kirim pengingat tagihan ramah ke pelanggan dalam 1-klik menggunakan deep link resmi WhatsApp (`wa.me`).
- 💾 **Penyimpanan Lokal Mandiri (*LocalStorage*)**: Semua data transaksi, stok, dan kas tersimpan otomatis di perangkat tanpa perlu setup database rumit.

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

Aplikasi ini dirancang **ringan, cepat, dan tanpa dependensi eksternal rumit (*zero external npm dependencies*)**.

### Prasyarat
Pastikan di komputer Anda sudah terpasang:
- **Node.js** (versi 16 atau lebih baru), ATAU
- **Laragon / XAMPP** (jika ingin dijalankan via web server Apache lokal).

---

### Cara 1: Menjalankan via Node.js (Direkomendasikan & Paling Mudah)

1. **Buka Terminal / Command Prompt** di direktori proyek ini:
   ```bash
   cd d:\laragon\www\ExplorAItion_hackathon
   ```

2. **Jalankan Server Lokal**:
   ```bash
   node server.js
   ```

3. **Buka di Browser**:
   Akses URL berikut melalui browser favorit Anda (Chrome, Edge, Firefox, dll.):
   ```text
   http://localhost:3000/
   ```

---

### Cara 2: Menjalankan via Laragon (Apache Web Server)

Jika Anda sudah menggunakan Laragon:
1. Pastikan folder proyek ini berada di `C:\laragon\www\` atau `D:\laragon\www\ExplorAItion_hackathon`.
2. Klik tombol **Start All** di aplikasi Laragon.
3. Buka browser dan akses:
   ```text
   http://localhost/ExplorAItion_hackathon/
   ```

---

## 📁 Struktur Berkas Proyek

```text
ExplorAItion_hackathon/
├── css/
│   └── style.css          # Desain antarmuka mobile-first kontras tinggi
├── js/
│   ├── app.js             # Kontroler UI, navigasi tab, & event handling
│   └── store.js           # Manajemen state kas, stok, piutang & LocalStorage
├── index.html             # Halaman utama aplikasi
├── server.js              # Server HTTP lokal mandiri (Node.js)
├── README.md              # Dokumentasi lengkap proyek (file ini)
├── AGENTS.md              # Aturan & prinsip alur kerja sistem AI
├── PRD.md                 # Product Requirements Document
├── PLAN.md                # Roadmap Vertical Slices fitur
├── TODO.md                # Pelacakan sub-tugas yang sedang aktif
└── MEMORY.md              # Log preferensi jangka panjang & tech stack
```

---

## 🗺️ Roadmap Pengembangan (Vertical Slices)

- [x] **Chunk 1**: Foundation Dashboard & State Management (Kas, Piutang, Stok Kritis).
- [ ] **Chunk 2**: Jalur Cepat Form Transaksi Manual (*Quick-Tap Entry* untuk antrean toko).
- [ ] **Chunk 3**: Conversational AI Copilot (Parser bahasa sehari-hari ala WhatsApp).
- [ ] **Chunk 4**: Simulasi Scan Nota Kamera & Ekstraksi Belanja Kulakan.
- [ ] **Chunk 5**: Proactive Smart Actions (Restock Kritis & Tombol Tagih via WhatsApp).

---

## 💡 Tips Penggunaan untuk Pengujian

- **Reset Data Demo**: Jika ingin mengembalikan data ke simulasi awal toko sembako, cukup klik tombol `🔄` di pojok kanan atas aplikasi.
- **Mode Mobile di PC**: Untuk pengalaman optimal seperti di layar ponsel, tekan `F12` di browser Anda lalu aktifkan *Device Toggle / Responsive Mode* (pilih iPhone / Samsung Galaxy).