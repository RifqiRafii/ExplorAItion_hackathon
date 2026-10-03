# Business & UI/UX Rules (WarungCopilot)

Berikut adalah panduan aturan bisnis (*business logic*) dan aturan antarmuka (*UI/UX rules*) yang wajib dipatuhi selama pengembangan proyek.

## 1. Multi-Tenant & Security Rules
- **Autentikasi Wajib**: Aplikasi tidak bisa diakses tanpa login. Redirect pengguna yang belum terautentikasi ke halaman `login.html`.
- **Data Isolation (RLS)**: Semua *query* ke Supabase (SELECT/INSERT/UPDATE) akan difilter secara otomatis oleh Row Level Security berdasarkan ID pengguna yang sedang login (`auth.uid()`). Dilarang keras men-disable RLS di tabel manapun kecuali dibutuhkan untuk autentikasi awal.

## 2. UI & Visual Design Rules
- **High-Contrast Friendly**: Desain harus menggunakan kontras tinggi.
- **Tipografi**: Font *Plus Jakarta Sans*. Angka saldo/stok harus tebal dan besar.
- **Palette Warna Utama (Google Stitch)**:
  - Primary (Positif / Kas): Emerald `#006948`
  - Tertiary (Peringatan / Piutang): Amber `#8d4b00`
  - Error (Bahaya / Stok Kritis): Crimson `#ba1a1a`
  - Surface (Background): `#faf8ff`
- **Aksesibilitas**: Tombol berukuran sentuh yang nyaman.
- **Layout Chat Copilot**: Menyerupai antarmuka WhatsApp.

## 3. Komunikasi & Bahasa (UX Writing)
- **Bahasa Indonesia Utama**: Semua teks menggunakan Bahasa Indonesia yang ramah.
- **Minim Jargon (Beginner First)**: Jangan gunakan istilah *debet*, *kredit*, atau *general ledger*. Gunakan *Kas*, *Bon*, *Kulakan*, *Laku*.
- **Pesan WhatsApp Sopan**: Template `wa.me` harus berisi kalimat penagihan yang menjaga perasaan pelanggan/tetangga.

## 4. Business Logic Rules
- **Real-Time UI Update**: Setelah *call* API ke Supabase berhasil, pastikan UI DOM langsung diperbarui agar pengguna tidak perlu memuat ulang halaman secara manual.
- **Threshold Stok Kritis**: Stok barang dianggap kritis jika nilainya `<= min_stock`.
- **Jatuh Tempo Piutang**: Sistem menandai piutang jatuh tempo jika hari ini melewati `due_date` dan memicu fitur "Tagih via WA".
