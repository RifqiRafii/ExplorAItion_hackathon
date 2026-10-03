# PRD: Smart Restock & Pembukuan AI Copilot (WarungCopilot)

## 1. Product Overview & Goals
**Smart Restock & Pembukuan AI Copilot** adalah asisten keuangan dan inventaris cerdas untuk pemilik UMKM (warung kelontong, ritel sembako, dan F&B). 

Aplikasi ini memecahkan masalah mendasar **"ilusi laba"**—di mana pedagang merasa dagangannya laris tetapi uang kas selalu menipis karena uang tertahan di barang menumpuk (*overstock*) dan catatan piutang/bon pelanggan yang hilang atau sungkan ditagih.

### Sasaran Utama:
1. **Zero Learning Curve & Dual Input Mode**: Menggantikan form akuntansi rumit dengan antarmuka obrolan (*conversational*) bahasa sehari-hari dan foto nota, sekaligus menyediakan **Jalur Cepat Form Manual (Quick-Tap Manual Form)** untuk input kilat saat warung sedang antre panjang/jam sibuk.
2. **Real-time Synchronized Tracking**: Sekali transaksi disimpan (baik lewat AI chat maupun form manual), otomatis memperbarui Saldo Kas, Stok Inventaris, dan Catatan Piutang.
3. **Proactive Smart Actions**: Asisten AI tidak pasif; secara otomatis memicu peringatan restock stok menipis dan menyiapkan draf penagihan piutang sopan via WhatsApp.

---

## 2. Target Audience & Use Cases
### Target Pengguna:
- Pemilik toko ritel tradisional (warung kelontong, agen sembako) dan usaha kuliner (F&B kekinian).
- Beroperasi secara mandiri tanpa staf administrasi/akuntansi khusus.
- Menggunakan ponsel sebagai perangkat kerja utama di toko.

### Skenario Penggunaan Utama:
1. **Pencatatan Transaksi Gabungan (Tunai & Bon)**: Pengguna mengetik *"Laku 3 sak beras, tapi 1 sak diutang Bu Siti"*. AI langsung memecah transaksi menjadi kas masuk, stok berkurang, dan piutang baru.
2. **Pencatatan Kilat Saat Antrean Ramai (Jalur Cepat Manual)**: Ketika toko sedang ramai dan banyak pembeli mengantre, pengguna dapat membuka popup Form Manual sederhana (pilih barang, ketik jumlah, centang tunai/bon) dengan 2-3 ketukan tanpa perlu berdialog dengan bot.
3. **Pencatatan via Foto Nota Belanja**: Pengguna memotret nota kulakan barang dari pasar/agen, AI mengekstrak item dan memperbarui stok serta kas keluar.
4. **Penyelamatan Piutang**: Sistem mengingatkan utang yang sudah jatuh tempo dan menyediakan tombol kirim pesan penagihan yang sopan ke WhatsApp pelanggan.
5. **Pencegahan Overstock & Kehabisan Stok**: Sistem memantau batas aman inventaris dan membuat draf pesanan kulakan ke agen rekanan.

---

## 3. User Journey / Happy Path Flow
1. **Langkah 1 (Buka Dashboard)**: Pengguna membuka aplikasi dan langsung melihat 3 indikator utama: **Saldo Kas Aktual**, **Total Piutang Belum Tertagih**, dan **Peringatan Stok Kritis**.
2. **Langkah 2 (Pilihan Jalur Input)**:
   - **Jalur Percakapan/Foto (AI Copilot)**: Tekan tombol FAB mikrofon/chat atau kamera foto nota.
   - **Jalur Cepat Manual (Quick Manual Entry)**: Tekan tombol "+ Transaksi Cepat" di dashboard untuk membuka modal form ringkas saat jam sibuk.
3. **Langkah 3 (Kartu Konfirmasi & Validasi)**:
   - Jika via AI: AI merespons dengan kartu ringkasan visual di dalam *chat bubble* (Kas, Stok, Piutang).
   - Jika via Form Manual: Tinjauan ringkas total belanja & status pembayaran langsung terlihat sebelum klik simpan.
4. **Langkah 4 (Persetujuan & Simpan Instan)**: Pengguna menekan tombol **"Setuju / Simpan"**. Dashboard utama langsung ter-update secara instan.
5. **Langkah 5 (Aksi Proaktif Otomatis)**:
   - Jika stok menyentuh batas minimum: AI mengirim pesan lanjutan: *"Stok beras sisa 2 sak. Ingin buat draf pesanan ke Agen Bintang?"* + Tombol **"Kirim Pesanan"**.
   - Jika ada piutang jatuh tempo: AI mengirim notifikasi: *"Piutang Bu Siti sudah 7 hari. Ingin dikirim pengingat?"* + Tombol **"Tagih via WhatsApp"** (langsung membuka WhatsApp dengan pesan yang sudah siap kirim).

---

## 4. UI/UX Direction & Layout Overview
- **Desain Halaman Utama (Beranda)**:
  - Gaya *Clean Mobile Dashboard* dengan kontras tinggi (*High-Contrast Friendly*).
  - Tipografi tebal dan angka besar agar jelas terbaca dalam pencahayaan toko yang redup atau terang.
  - Kartu Metrik Utama:
    - Saldo Kas (Hijau kontras)
    - Total Piutang Aktif (Oranye/Kuning peringatan)
    - Indikator Stok Kritis (Merah alert)
  - Akses Cepat Tombol: "+ Transaksi Cepat (Form Manual)" dan Tombol Melayang (FAB) "Tanya/Chat AI Copilot".
- **Desain Panel Interaksi Copilot**:
  - Tampilan mirip antarmuka **WhatsApp** yang sangat akrab di mata pengguna.
  - Semua tombol interaksi (*Setuju*, *Ubah*, *Tagih via WA*, *Pesan Stok*) disematkan langsung di dalam *chat bubble*.
- **Desain Modal Form Manual Cepat**:
  - Form super simpel (Pilih Produk dari dropdown/tombol cepat, Jumlah, Status Pembayaran: Lunas/Bon, Nama Pembeli jika bon) yang selesai diisi dalam < 10 detik.
- **Aksesibilitas**: Tombol berukuran sentuh nyaman (*finger-friendly*), teks jelas, bebas jargon istilah asing seperti debet/kredit.

---

## 5. Scope Guardrails (Batasan Ruang Lingkup V1)
Untuk memastikan prototipe cepat selesai, teruji, dan stabil:

### Termasuk di V1:
- Antarmuka Mobile Dashboard responsif dengan metrik Kas, Piutang, dan Stok.
- Jalur Cepat Transaksi Manual (Modal Form Cepat tanpa dialog AI).
- Panel Conversational Copilot ala WhatsApp dengan simulated AI parser untuk bahasa sehari-hari.
- Fitur input teks dan simulasi scan nota kamera.
- Kartu konfirmasi interaktif di dalam chat bubble dengan tombol aksi langsung.
- Fitur Proactive Smart Action:
  - Peringatan stok kritis + Draf pesanan restock.
  - Peringatan piutang jatuh tempo + Tombol integrasi deep-link WhatsApp (`wa.me`) dengan pesan otomatis sopan.
- Penyimpanan lokal (*Local Storage / State Management*) sehingga data transaksi, stok, dan piutang tetap tersimpan saat direfresh.

### Di Luar Ruang Lingkup V1 (Out of Scope):
- Integrasi Payment Gateway / QRIS dinamis bank.
- Manajemen multi-cabang/multi-toko.
- Integrasi mesin printer struk thermal bluetooth fisik.
- Modul perpajakan rumit (PPN/PPh).
