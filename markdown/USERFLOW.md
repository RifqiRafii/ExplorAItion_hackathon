# User Flow & Journey (WarungCopilot)

Dokumen ini menjelaskan alur pengguna (User Flow) dalam menggunakan aplikasi Smart Restock & Pembukuan AI Copilot, termasuk sistem multi-tenant berbasis Supabase.

## 0. Flow Registrasi & Login UMKM
1. Pengguna membuka aplikasi dan diarahkan ke halaman Login/Register.
2. Pengguna membuat akun baru (Email & Password) atau masuk ke akun yang sudah ada via Supabase Auth.
3. Saat registrasi pertama kali, pengguna diminta memasukkan Nama Warung (menyimpan ke `umkm_profiles`).
4. Setelah berhasil login, aplikasi menyimpan session (Token) dan mengarahkan pengguna ke Dashboard Utama.

## 1. Flow Buka Dashboard (Happy Path)
1. Aplikasi memverifikasi session Supabase. Jika valid, tarik data profil warung berdasarkan `umkm_id`.
2. Dashboard menampilkan 3 Metrik Utama (Data ditarik dari Cloud):
   - **Saldo Kas Aktual** (Hijau)
   - **Total Piutang Aktif** (Oranye/Kuning)
   - **Indikator Stok Kritis** (Merah)
3. Pengguna melihat daftar mutasi transaksi terakhir di bawah metrik.

## 2. Flow Pencatatan via AI Copilot (Chat Mode)
1. Pengguna menekan tombol FAB (Floating Action Button) berbentuk ikon chat/mikrofon.
2. Panel chat AI Copilot terbuka.
3. Pengguna mengetik: *"Laku 3 sak beras, tapi 1 sak diutang Bu Siti"*.
4. AI Parser memproses kalimat dan menampilkan **Kartu Konfirmasi** di dalam *chat bubble*.
5. Pengguna menekan tombol **"Setuju / Simpan"**.
6. Data dikirim ke database Supabase (Tabel `transactions`, `debts`, update `products` & `umkm_profiles`). Metrik di Dashboard langsung *re-fetch* dan ter-update.

## 3. Flow Pencatatan via Form Manual Cepat (Quick-Tap Entry)
1. Pengguna menekan tombol **"+ Transaksi Cepat"** di halaman Dashboard.
2. Modal Form muncul. Pengguna memilih barang dari daftar produk Supabase.
3. Pengguna memasukkan kuantitas dan memilih metode: **"Lunas"** atau **"Bon"**.
4. Pengguna menekan **"Simpan"**.
5. Transaksi disimpan ke Supabase Cloud dan metrik di Dashboard langsung diperbarui.

## 4. Flow Input via Pemindaian Nota (Kulakan)
1. Pengguna menekan tombol ikon **Kamera / Unggah Foto** di panel Chat.
2. Sistem menyimulasikan ekstraksi (*scanning animation*).
3. Pengguna mendapat Kartu Konfirmasi Kulakan dan menekan **"Simpan ke Inventaris"**.
4. Stok bertambah dan saldo kas berkurang di Supabase.

## 5. Flow Proactive Smart Actions (Otomatisasi)
- **Alert Stok Menipis**: Jika stok dari Supabase balikan <= `min_stock`, muncul chat: *"Stok beras sisa 2 sak. Ingin buat draf pesanan ke Agen Bintang?"* (Tombol WA).
- **Alert Penagihan Piutang**: Jika ada utang `UNPAID` dan melewati `due_date`, muncul chat peringatan penagihan dengan tombol draf WhatsApp.
