# PLAN: Smart Restock & Pembukuan AI Copilot (WarungCopilot)

Roadmap implementasi terstruktur dalam bentuk **Vertical Slices** (fitur lengkap dari antarmuka hingga penyimpanan data yang dapat diuji langsung oleh pengguna di setiap tahap).

---

## Roadmap Vertical Slices

### [ ] Chunk 1: Foundation Dashboard & State Management
- [ ] Buat struktur proyek web modern yang bersih, cepat, dan mobile-first.
- [ ] Implementasikan sistem desain visual kontras tinggi (*High-Contrast Friendly*, tipografi tebal, warna status kas/piutang/stok yang tegas).
- [ ] Buat *State Manager* lokal (Local Storage) untuk menyimpan data Saldo Kas, Inventaris Stok Barang, dan Catatan Piutang agar tidak hilang saat halaman direfresh.
- [ ] Buat tampilan Dashboard Utama dengan 3 kartu metrik besar (Kas Aktual, Total Piutang Aktif, Indikator Stok Kritis) serta daftar inventaris & mutasi transaksi awal.
- [ ] Siapkan data awal (*starter demo data*) warung kelontong (Beras, Minyak Goreng, Gula Pasir, Telur).

### [ ] Chunk 2: Jalur Cepat Form Transaksi Manual (Quick-Tap Entry)
- [ ] Tambahkan tombol "+ Transaksi Cepat" yang menonjol di halaman Dashboard.
- [ ] Buat Modal Form Transaksi Cepat dengan pengalaman input kilat (< 10 detik):
  - Dropdown/chip pilihan produk cepat.
  - Input kuantitas dengan kalkulasi otomatis total belanja.
  - Pilihan metode: "Lunas (Kas Masuk)" atau "Kasbon / Bon (Catat Piutang)".
  - Input nama pengutang jika memilih Bon.
- [ ] Hubungkan form ke State Manager: otomatis potong stok, tambah kas (jika lunas), atau buat entri piutang baru (jika bon).
- [ ] Berikan notifikasi instan dan perbarui angka di dashboard secara real-time.

### [ ] Chunk 3: Conversational AI Copilot & Parsing Bahasa Sehari-hari
- [ ] Buat panel antarmuka obrolan (*Conversational Assistant*) melayang yang dapat dibuka via Floating Action Button (FAB) berlogo AI.
- [ ] Rancang UI obrolan ala WhatsApp (avatar asisten AI, bubble chat, bubble stempel waktu, input pesan, dan tombol saran contoh ucapan).
- [ ] Bangun mesin AI Parser untuk memahami kalimat bahasa Indonesia sehari-hari (contoh: *"Laku 3 sak beras, 1 sak diutang Bu Siti"* atau *"Jual 2 minyak goreng tunai"*).
- [ ] Tampilkan **Kartu Konfirmasi Interaktif** di dalam chat bubble AI (detail Kas Masuk, Stok Berkurang, Piutang Tercatat).
- [ ] Tambahkan tombol "Setuju / Simpan" dan "Batal" di dalam kartu. Saat ditekan "Setuju", mutasi langsung diterapkan ke dashboard.

### [ ] Chunk 4: Simulasi Scan Nota Kamera & Ekstraksi Kulakan
- [ ] Tambahkan tombol ikon kamera di panel input chat dan dashboard.
- [ ] Buat modal/panel unggah foto nota belanja kulakan dengan opsi preset nota nyata (misal: nota kulakan beras & minyak dari agen).
- [ ] Implementasikan efek visual pemindaian (*scanning animation*) yang interaktif.
- [ ] Bangun parser ekstraksi nota belanja (AI OCR Simulator) untuk mendeteksi barang masuk dan total belanja modal.
- [ ] Tampilkan kartu konfirmasi kulakan di chat bubble: Stok bertambah, Kas berkurang. Tombol 1-klik untuk simpan ke inventaris.

### [ ] Chunk 5: Proactive Smart Actions (Restock Kritis & Penagihan WhatsApp)
- [ ] Implementasikan detektor stok minimum: Jika stok <= batas aman setelah transaksi, AI memunculkan rekomendasi restock proaktif: *"Stok beras sisa 2 sak. Buat draf pesanan ke Agen Bintang?"* + tombol "Kirim Pesanan".
- [ ] Buat panel khusus "Buku Bon & Piutang" dengan indikator hari jatuh tempo dan status pembayaran.
- [ ] Implementasikan fitur penagihan cerdas: tombol "Tagih via WhatsApp" dengan generator deep-link `wa.me` berisi pesan sopan, santun, dan tidak menyinggung pelanggan.
- [ ] Tambahkan tombol "Cek Laba Riil Hari Ini": ringkasan singkat uang kas vs modal barang terjual untuk mengikis "ilusi laba".
- [ ] Pengujian menyeluruh (*End-to-End Test*) dan pemolesan UX akhir.
