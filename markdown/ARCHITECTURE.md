# System Architecture (WarungCopilot V1)

Aplikasi WarungCopilot V1 dibangun dengan arsitektur **Modern Single Page Application (SPA) Vanilla** tanpa kerangka kerja (framework) berat seperti React/Vue/Node.js backend, demi kecepatan eksekusi prototipe, dapat berjalan murni di peramban (browser), dan mudah di-host di lingkungan lokal seperti Laragon.

## 1. Teknologi Dasar (Tech Stack)
- **Frontend / Struktur**: HTML5 (Semantic HTML).
- **Styling**: Vanilla CSS / Tailwind CSS (via CDN) dengan kustomisasi palet warna desain Google Stitch.
- **Logika & Interaktivitas**: JavaScript Modern (ES6 Modules).
- **State & Data Storage**: `Window.localStorage` (Browser API).
- **Ikon**: Google Material Symbols Outlined (CDN).

## 2. Struktur Proyek & Modul
Arsitektur menggunakan pola *Modular JavaScript* untuk memisahkan tanggung jawab (Separation of Concerns).

```text
ExplorAItion_hackathon/
│
├── index.html            # Entry point, Layout Dashboard Utama & Modal Cepat
├── chat.html             # UI Khusus Panel Chat Copilot (jika dipisah)
├── piutang.html          # UI Halaman Buku Bon / Piutang
├── stok.html             # UI Halaman Manajemen Inventaris
│
├── css/
│   └── style.css         # Custom utility classes & CSS variables
│
├── js/
│   ├── main.js           # Inisialisasi aplikasi, event listener UI utama
│   ├── store.js          # State Manager (Wrapper untuk LocalStorage CRUD)
│   ├── ai-parser.js      # Mesin simulasi NLP (Regex/Keyword matching) untuk chat
│   └── components.js     # Fungsi untuk me-render HTML komponen (Kartu, Chat Bubble)
│
└── assets/               # Gambar, logo, ikon lokal (Avatar AI)
```

## 3. Komponen Utama Arsitektur

### A. State Manager (`store.js`)
Bertanggung jawab atas semua operasi baca-tulis ke `localStorage`. 
Memiliki metode fungsional seperti:
- `getKas()`, `addKas(amount)`, `reduceKas(amount)`
- `getProducts()`, `updateStock(productId, qty)`
- `getDebts()`, `addDebt(data)`, `payDebt(debtId)`
- Menjamin konsistensi data sebelum fungsi UI dijalankan.

### B. NLP Parser Engine Simulator (`ai-parser.js`)
Karena ini adalah prototipe frontend-only, pemrosesan bahasa alami (NLP) disimulasikan menggunakan deteksi kata kunci (Keyword/Regex extraction):
- **Intent Detection**: Mendeteksi kata kerja (`laku`, `jual`, `beli`, `kulakan`).
- **Entity Extraction**: Mendeteksi jumlah (angka), nama barang (dicocokkan dengan ID produk di store), nama pelanggan, dan status pembayaran (`utang`, `bon`, `tunai`).
- Mengembalikan *JSON object* terstruktur ke UI untuk merender Kartu Konfirmasi.

### C. Event & Reactivity (`main.js` & `components.js`)
Bekerja secara prosedural merespons interaksi pengguna:
1. Menangkap *event* (klik tombol, kirim pesan chat).
2. Memanggil fungsi logika / parser.
3. Menyimpan mutasi data lewat `store.js`.
4. Memicu fungsi *re-render* pada elemen DOM yang terdampak (misal: `document.getElementById('saldo-kas').innerText = ...`).

## 4. Keamanan & Batasan
- Data sepenuhnya berada di sisi klien (Client-side / Browser). Tidak ada data yang dikirim ke server. Cocok untuk privasi di fase prototipe.
- Saat ini tidak ada sistem *User Authentication* (Login/Register). Aplikasi langsung terbuka pada status *logged in* (Single Tenant).
