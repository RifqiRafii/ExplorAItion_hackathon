# User Flow & Journey (WarungCopilot)

Dokumen ini menjelaskan alur pengguna (User Flow) dalam menggunakan aplikasi Smart Restock & Pembukuan AI Copilot. Terdapat dua mode input utama: Chat AI (Conversational) dan Form Manual (Quick-Tap).

## 1. Flow Buka Dashboard (Happy Path)
1. Pengguna membuka aplikasi di browser HP (Mobile Dashboard).
2. Sistem memuat data dari `LocalStorage`.
3. Dashboard menampilkan 3 Metrik Utama:
   - **Saldo Kas Aktual** (Hijau)
   - **Total Piutang Aktif** (Oranye/Kuning)
   - **Indikator Stok Kritis** (Merah)
4. Pengguna melihat daftar mutasi transaksi terakhir di bawah metrik.

## 2. Flow Pencatatan via AI Copilot (Chat Mode)
*Skenario: Toko sedang santai, pengguna ingin mencatat transaksi dengan cepat lewat bahasa sehari-hari.*
1. Pengguna menekan tombol FAB (Floating Action Button) berbentuk ikon chat/mikrofon.
2. Panel chat AI Copilot ala WhatsApp terbuka dari bawah atau samping.
3. Pengguna mengetik: *"Laku 3 sak beras, tapi 1 sak diutang Bu Siti"*.
4. AI Parser memproses kalimat dan menampilkan **Kartu Konfirmasi** di dalam *chat bubble*:
   - Kas Masuk: Harga 2 sak beras.
   - Piutang: Harga 1 sak beras (Bu Siti).
   - Stok Keluar: 3 sak beras.
5. Pengguna menekan tombol **"Setuju / Simpan"** pada kartu.
6. Data tersimpan ke State Manager. Metrik di Dashboard ter-update secara instan.

## 3. Flow Pencatatan via Form Manual Cepat (Quick-Tap Entry)
*Skenario: Toko sedang ramai/antre, butuh pencatatan kilat di bawah 10 detik tanpa ngobrol dengan AI.*
1. Pengguna menekan tombol **"+ Transaksi Cepat"** di halaman Dashboard.
2. Modal Form muncul.
3. Pengguna memilih barang dari dropdown/chip yang sudah tersedia.
4. Pengguna memasukkan kuantitas. Total harga terhitung otomatis.
5. Pengguna memilih metode pembayaran: **"Lunas"** atau **"Bon"**.
   - Jika "Bon", input nama pengutang (misal: "Pak RT").
6. Pengguna menekan **"Simpan"**.
7. Modal tertutup, metrik di Dashboard langsung ter-update.

## 4. Flow Input via Pemindaian Nota (Kulakan)
*Skenario: Pengguna baru saja kulakan dari agen grosir.*
1. Pengguna membuka panel Chat AI Copilot.
2. Menekan tombol ikon **Kamera / Unggah Foto**.
3. Sistem menyimulasikan pemindaian (*scanning animation*) pada foto nota belanja.
4. AI mengekstrak data dan memunculkan Kartu Konfirmasi Kulakan (Barang bertambah, Kas berkurang).
5. Pengguna menekan **"Simpan ke Inventaris"**. Stok bertambah dan saldo kas berkurang.

## 5. Flow Proactive Smart Actions (Otomatisasi)
Aplikasi bekerja aktif mengingatkan pengguna atas 2 hal krusial:
- **Alert Stok Menipis**: 
  - Jika setelah transaksi stok beras menyentuh batas minimum (misal <= 3), AI mengirim pesan chat otomatis: *"Stok beras sisa 2 sak. Ingin buat draf pesanan ke Agen Bintang?"*.
  - Pengguna bisa menekan tombol **"Kirim Pesanan"** (mengarah ke WhatsApp agen).
- **Alert Penagihan Piutang**: 
  - Jika ada utang pelanggan yang jatuh tempo (> 7 hari), sistem memunculkan notifikasi atau chat AI: *"Piutang Bu Siti sudah 7 hari. Ingin dikirim pengingat?"*.
  - Pengguna menekan tombol **"Tagih via WhatsApp"**. Aplikasi membuka link `wa.me` dengan draf teks sopan yang sudah disiapkan.
