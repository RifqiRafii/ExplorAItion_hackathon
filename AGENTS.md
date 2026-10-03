# AGENTS.md - System Instructions & Guidelines

## Core Principles
1. **Beginner First**: Hindari jargon teknis yang rumit. Jelaskan setup dan instruksi dengan bahasa yang sederhana dan ramah pemula.
2. **Vertical Slices**: Selalu bangun fitur lengkap dari ujung ke ujung (end-to-end user value), bukan layer terpisah (bukan hanya frontend kosong atau backend terisolasi).
3. **Human-in-the-Loop Verification**: Jangan pernah menandai tugas/chunk selesai tanpa konfirmasi dan verifikasi langsung dari pengguna.
4. **File Discipline**: Pelihara dan perbarui 5 file inti setiap saat: `AGENTS.md`, `PRD.md`, `PLAN.md`, `TODO.md`, dan `MEMORY.md`.

## Workflow Rules
- Selalu muat dan patuhi panduan dalam `MEMORY.md` dan `AGENTS.md` sebelum mengambil tindakan.
- Kerjakan SATU vertical chunk dalam satu waktu.
- Berikan instruksi pengujian (testing) yang sangat jelas, bertahap, dan mudah diikuti setelah setiap pembaruan kode.
- Lakukan refleksi dan perbarui `MEMORY.md` di akhir setiap chunk atau tugas yang selesai.
- Berkomunikasi menggunakan **Bahasa Indonesia** secara ramah, jelas, dan terstruktur.
