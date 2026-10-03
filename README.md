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
├── assets/
│   ├── logo.png               # Logo resmi WarungCopilot dari Stitch
│   └── avatar_pak_budi.png    # Avatar kasir Pak Budi dari Stitch
├── stitch_warungcopilot_ai_assistant/ # Sumber asli hasil ekspor Google Stitch
├── js/
│   ├── app.js                 # Kontroler UI, router view, AI parser, & event handler
│   └── store.js               # Manajemen state terpadu (Kas, Stok, Piutang) & LocalStorage
├── index.html                 # Master Web App terpadu (SPA dengan navigasi 4 modul Stitch)
├── beranda.html               # Halaman mandiri: Beranda & Arus Kas
├── chat.html                  # Halaman mandiri: Copilot AI Chat ala WhatsApp
├── piutang.html               # Halaman mandiri: Buku Piutang & Penagihan Pintar
├── stok.html                  # Halaman mandiri: Stok & Rekomendasi Restock AI
├── server.js                  # Server HTTP lokal mandiri (Node.js)
├── README.md                  # Dokumentasi lengkap proyek (file ini)
├── AGENTS.md                  # Aturan & prinsip alur kerja sistem AI
├── PRD.md                     # Product Requirements Document
├── PLAN.md                    # Roadmap Vertical Slices fitur
├── TODO.md                    # Pelacakan sub-tugas yang sedang aktif
└── MEMORY.md                  # Log preferensi jangka panjang & Stitch Design System
```

---

## 🖥️ Panduan 4 Modul Layar (Google Stitch)

1. **Beranda & Arus Kas** (`#beranda` atau `beranda.html`):
   - 3 Metrik Vital Ilusi Laba: Kas Aktual Riil, Piutang Mengendap, Nilai Aset Stok.
   - Copilot Action Feed (Peringatan Stok Genting & Piutang Jatuh Tempo).
   - Akses Cepat Tombol: "+ Transaksi Cepat (< 10 Detik)", "Dikte Suara AI", dan "Foto Nota Kulakan".
   - Grafik Arus Kas Masuk vs Keluar mingguan & Aktivitas kasir terkini.
2. **Copilot AI Chat** (`#chat` atau `chat.html`):
   - Antarmuka obrolan ala WhatsApp dengan AI Parser bahasa sehari-hari.
   - Kartu Konfirmasi Interaktif dengan tombol *"Setuju & Simpan ke Buku Kas"*.
   - Quick Prompt Pills & Simulasi Voice Dictation.
3. **Buku Piutang & Penagihan Pintar** (`#piutang` atau `piutang.html`):
   - Pelacakan kartu bon pelanggan dengan status hari jatuh tempo.
   - Filter: Semua Bon, Kritis Lewat Tempo, dan Aman.
   - Tombol **"Tagih via WhatsApp"** yang otomatis membuka WhatsApp (`wa.me`) dengan pesan santun dan ramah.
   - Tombol **"Tandai Lunas"** yang langsung memindahkan nominal ke uang kas riil.
4. **Stok & Restock Otomatis** (`#stok` atau `stok.html`):
   - 5 Bento metrik inventaris (SKU Aktif, Kritis Habis, Menipis, Modal Mati, Estimasi Kulakan).
   - Tabel inventaris dengan badge status otomatis dan filter pencarian.
   - Draf PO Grosir ke agen supplier via WhatsApp.

---

## 💡 Tips Penggunaan untuk Pengujian

- **Akses Langsung**: Buka [http://localhost:3000/](http://localhost:3000/) di browser Anda.
- **Navigasi Cepat**: Gunakan menu di sidebar sebelah kiri untuk berpindah modul secara instan tanpa perlu memuat ulang halaman.
- **Reset Data Demo**: Cukup klik tombol `🔄` di panel Warung Berkah pada sidebar untuk mengembalikan simulasi ke kondisi awal.