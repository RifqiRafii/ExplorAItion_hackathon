# System Architecture (WarungCopilot V1 - Supabase Edition)

Aplikasi WarungCopilot V1 mengadopsi arsitektur **Single Page Application (SPA)** yang di-host secara lokal (Vanilla HTML/JS) namun didukung oleh layanan *Backend-as-a-Service (BaaS)* **Supabase** untuk Database dan Autentikasi di cloud.

## 1. Teknologi Dasar (Tech Stack)
- **Frontend / Struktur**: HTML5.
- **Styling**: Vanilla CSS / Tailwind CSS (via CDN) dengan palet Google Stitch.
- **Logika Frontend**: JavaScript Modern (ES6 Modules).
- **Backend / Database / Auth**: **Supabase** (Client library: `@supabase/supabase-js` CDN).

## 2. Struktur Proyek & Modul

```text
ExplorAItion_hackathon/
│
├── login.html            # Halaman Registrasi & Autentikasi Supabase
├── index.html            # Dashboard Utama, Modal Cepat, dan UI Chat
├── piutang.html          # Halaman Buku Bon
├── stok.html             # Halaman Manajemen Inventaris
│
├── css/
│   └── style.css         
│
├── js/
│   ├── supabase.js       # Konfigurasi & Inisialisasi Supabase Client (Keys)
│   ├── auth.js           # Fungsi Register, Login, Logout, dan Cek Session
│   ├── main.js           # Router sederhana & UI Event listener
│   ├── api.js            # Wrapper fungsi async memanggil tabel Supabase (CRUD)
│   └── ai-parser.js      # NLP Parser Simulator (Regex/Keywords)
│
└── assets/               # Gambar, logo, ikon
```

## 3. Komponen Utama Arsitektur

### A. Autentikasi (`auth.js` & Supabase)
- Aplikasi akan selalu mengecek session (`supabase.auth.getSession()`).
- Jika tidak ada session, lempar (*redirect*) ke `login.html`.
- Jika ada, ekstrak `user_id` untuk digunakan sebagai `umkm_id` di setiap query.

### B. Database Access (`api.js`)
- Menggantikan fungsi *store* LocalStorage lama.
- Semua aksi menjadi *Asynchronous* (`async/await`) untuk berkomunikasi dengan API Supabase.
- Karena RLS diaktifkan di Supabase, query seperti `supabase.from('products').select('*')` hanya akan mengembalikan produk milik UMKM yang sedang *login*.

### C. Simulasi AI (`ai-parser.js`)
- Berjalan di *client-side* untuk memecah bahasa alami (NLP simulator).
- Merangkai *JSON object payload* yang nantinya akan dikirim ke fungsi `api.js` untuk dimasukkan ke tabel `transactions`.

## 4. Keamanan Data
- **Row Level Security (RLS)**: Diatur di server PostgreSQL Supabase sehingga data (Kas, Stok, Piutang) 100% terisolasi antar UMKM/User.
- **No Backend Server Needed**: Keamanan dikelola sepenuhnya oleh token JWT Supabase, meniadakan kebutuhan backend Node.js untuk versi prototipe ini.
