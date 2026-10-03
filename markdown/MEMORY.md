# MEMORY.md - Long-Term Learning & Preferences Log

## Tech Stack
- Frontend: Modern Single Page Application (SPA), HTML5, Semantic Elements.
- Styling: Google Stitch "WarungCopilot Modern Retail Engine" Design System (Tailwind CSS CDN dengan custom palette tokens, Plus Jakarta Sans, Google Material Symbols Outlined).
- State & Persistence: Modular JavaScript (ES Modules) + **Supabase (Auth & PostgreSQL)**. Menggunakan Supabase-JS CDN untuk login setiap UMKM dan penyimpanan data cloud.
- Asset Management: Logo & avatar lokal di folder `assets/` dengan CDN fallback.

## UI/UX Rules
- Desain Visual Resmi: Mengadopsi 100% spesifikasi visual Google Stitch (Palette: Primary Emerald `#006948`, Tertiary Amber `#8d4b00`, Error Crimson `#ba1a1a`, Surface `#faf8ff`).
- Bahasa interaksi dan dokumentasi utama: Bahasa Indonesia.
- Komunikasi ramah pemula dan minim jargon teknis (hindari debet/kredit/gl).
- Visual Design: Kombinasi Clean Retail Dashboard dengan Sidebar navigasi lengkap dan Conversational Assistant ala WhatsApp.
- Fitur Multi-Tenant: Terdapat halaman Login/Registrasi untuk memisahkan data setiap entitas UMKM.
- Kartu Aksi Cepat (Smart Action): Tombol konfirmasi, penagihan WA langsung (`wa.me`), draf PO agen grosir, dan form transaksi kilat (< 10 detik).
- Dual Input Mode: Mendukung AI Conversational Chat & Jalur Cepat Form Manual (Quick-Tap) untuk antisipasi antrean ramai di warung.

## Tooling & Environment
- Direktori Proyek: `d:\laragon\www\ExplorAItion_hackathon`
- Sistem Operasi: Windows
- Lingkungan Lokal: Laragon / PowerShell

## Dokumentasi Proyek
- [SCHEMA.md](file:///c:/Users/ARIEL/OneDrive/Documents/ExplorAItion_hackathon/SCHEMA.md): Skema database LocalStorage.
- [USERFLOW.md](file:///c:/Users/ARIEL/OneDrive/Documents/ExplorAItion_hackathon/USERFLOW.md): Alur pengguna utama.
- [RULES.md](file:///c:/Users/ARIEL/OneDrive/Documents/ExplorAItion_hackathon/RULES.md): Aturan bisnis dan pedoman UI/UX.
- [ARCHITECTURE.md](file:///c:/Users/ARIEL/OneDrive/Documents/ExplorAItion_hackathon/ARCHITECTURE.md): Penjelasan struktur aplikasi.
