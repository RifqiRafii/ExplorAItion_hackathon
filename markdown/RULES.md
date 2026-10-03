# Business & UI/UX Rules (WarungCopilot)

Berikut adalah panduan aturan bisnis (*business logic*) dan aturan antarmuka (*UI/UX rules*) yang wajib dipatuhi selama pengembangan proyek ini berdasarkan instruksi di `AGENTS.md` dan `MEMORY.md`.

## 1. UI & Visual Design Rules
- **High-Contrast Friendly**: Desain harus menggunakan kontras tinggi agar mudah dibaca di lingkungan toko yang terang atau redup.
- **Tipografi**: Gunakan font *Plus Jakarta Sans*. Angka saldo kas, stok, dan piutang harus besar dan tebal (Bold).
- **Palette Warna Utama (Google Stitch)**:
  - Primary (Positif / Kas): Emerald `#006948`
  - Tertiary (Peringatan / Piutang): Amber `#8d4b00`
  - Error (Bahaya / Stok Kritis): Crimson `#ba1a1a`
  - Surface (Background): `#faf8ff`
- **Aksesibilitas / Finger-friendly**: Area sentuh tombol (*touch target*) minimal 48x48px agar mudah ditekan di layar HP.
- **Layout Chat Copilot**: Harus menyerupai antarmuka WhatsApp (bubble chat warna hijau/putih, ada stempel waktu, dan avatar).

## 2. Komunikasi & Bahasa (UX Writing)
- **Bahasa Indonesia Utama**: Semua antarmuka, notifikasi, dan pesan AI wajib menggunakan Bahasa Indonesia yang ramah, sopan, dan terstruktur.
- **Minim Jargon (Beginner First)**: Dilarang keras menggunakan istilah akuntansi rumit seperti *debet*, *kredit*, *general ledger*, atau *jurnal*. Gunakan istilah yang dipahami pemilik warung: *Kas*, *Bon/Piutang*, *Stok*, *Kulakan*, *Laku*.
- **Pesan Penagihan Sopan**: Teks yang dihasilkan untuk dikirim ke WhatsApp penagihan harus bernada sopan, santun, dan tidak menyinggung perasaan pelanggan (menjaga hubungan baik bertetangga).

## 3. Business Logic Rules (Aturan Aplikasi)
- **Real-Time Synchronization**: Setiap aksi (simpan transaksi, tambah piutang, kulakan) HARUS langsung memperbarui indikator metrik utama tanpa perlu memuat ulang (*refresh*) halaman (gunakan reactivity pattern/DOM manipulation).
- **Threshold Stok Kritis**: Stok barang dianggap kritis jika nilainya `<= minStock`. Sistem wajib memicu peringatan (Proactive Alert) saat ini terjadi.
- **Jatuh Tempo Piutang**: Sistem harus menandai piutang sebagai jatuh tempo jika sudah melewati batas waktu yang ditentukan (misal default 7 hari) dan merekomendasikan penagihan via WhatsApp.
- **State Persistence**: Data tidak boleh hilang saat browser direfresh. Wajib membaca dari dan menyimpan kembali ke `localStorage` untuk setiap mutasi state.
- **Vertical Slices Requirement**: Fitur tidak boleh setengah jadi (misal hanya UI tanpa fungsi). Setiap *chunk* harus merupakan fitur lengkap dari ujung ke ujung (*end-to-end user value*) sebelum dianggap selesai.
