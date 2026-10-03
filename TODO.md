# TODO: Integrasi Desain Google Stitch & State Terpadu

**Status**: Selesai Diimplementasikan (Menunggu Verifikasi Pengguna)  
**Tujuan**: Mengintegrasikan 4 layar desain resmi dari Google Stitch ke dalam aplikasi terpadu WarungCopilot dengan state management dan interaktivitas penuh.

---

### Sub-Tugas yang Telah Selesai:
- [x] Ekstraksi dan pengorganisasian aset lokal: `assets/logo.png` dan `assets/avatar_pak_budi.png`.
- [x] Implementasi sistem desain Google Stitch (Tailwind CSS Extended Tokens, Plus Jakarta Sans, Material Symbols).
- [x] Integrasi Layar 1: **Beranda & Arus Kas** (Metrik Ilusi Laba, Action Feed, Grafik Mingguan, Aktivitas Kasir Terkini).
- [x] Integrasi Layar 2: **Copilot AI Chat** (Kanvas percakapan ala WhatsApp, parser kalimat bahasa sehari-hari, kartu konfirmasi transaksi interaktif).
- [x] Integrasi Layar 3: **Buku Piutang & Kasbon** (Pelacakan hari jatuh tempo, filter status kritis/aman, generator penagihan ramah via deep-link `wa.me`).
- [x] Integrasi Layar 4: **Stok & Restock Otomatis** (Bento metrik inventaris, deteksi modal mati, draf PO grosir ke agen supplier).
- [x] Integrasi Modal Interaktif:
  - Modal Transaksi Kilat (< 10 detik kasir).
  - Modal Draf WA Penagihan Ramah.
  - Modal Scan Kamera Nota Kulakan (Laser OCR simulation).
  - Modal QRIS Toko Berkah.
  - Draf Pesanan Grosir (PO Agen).
- [x] Sinkronisasi State Management (`js/store.js`) & LocalStorage antar semua layar.
- [ ] Pengujian dan verifikasi langsung oleh pengguna di browser (`http://localhost:3000`).
