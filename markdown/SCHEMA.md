# Database Schema (Supabase)
Aplikasi WarungCopilot menggunakan **Supabase** (PostgreSQL & Auth) untuk menyimpan data di cloud dan mendukung fitur *multi-tenant* (banyak warung / UMKM dengan akun masing-masing). Setiap tabel (kecuali `users`) dilengkapi dengan `umkm_id` dan diamankan dengan *Row Level Security (RLS)*.

## 1. Tabel: `users` (Otomatis dari Supabase Auth)
Menyimpan data autentikasi UMKM.
- `id` (UUID, Primary Key)
- `email` (String)
- `created_at` (Timestamp)

## 2. Tabel: `umkm_profiles` (Profil Warung)
Menyimpan profil tambahan dan total kas dari setiap warung.
- `id` (UUID, Primary Key, berelasi dengan `users.id`)
- `warung_name` (String)
- `owner_name` (String)
- `cash_balance` (Integer, default 0) - Saldo kas saat ini
- `created_at` (Timestamp)

## 3. Tabel: `products` (Inventaris Stok)
Menyimpan daftar barang yang dijual per UMKM.
- `id` (UUID, Primary Key)
- `umkm_id` (UUID, Foreign Key ke `umkm_profiles.id`)
- `name` (String)
- `price` (Integer)
- `stock` (Integer)
- `min_stock` (Integer)
- `unit` (String, cth: "sak", "pcs")

## 4. Tabel: `transactions` (Mutasi Transaksi)
Menyimpan histori transaksi masuk dan keluar per UMKM.
- `id` (UUID, Primary Key)
- `umkm_id` (UUID, Foreign Key ke `umkm_profiles.id`)
- `created_at` (Timestamp)
- `type` (String: "IN", "OUT")
- `payment_method` (String: "CASH", "CREDIT")
- `total_amount` (Integer)
- `items` (JSONB) - Menyimpan detail barang (productId, name, qty, subtotal)
- `debt_id` (UUID, Opsional, Foreign Key ke `debts.id` jika CREDIT)

## 5. Tabel: `debts` (Buku Piutang / Bon)
Menyimpan catatan pelanggan yang berutang (kasbon).
- `id` (UUID, Primary Key)
- `umkm_id` (UUID, Foreign Key ke `umkm_profiles.id`)
- `customer_name` (String)
- `customer_phone` (String, opsional)
- `amount` (Integer)
- `created_at` (Timestamp)
- `due_date` (Timestamp)
- `status` (String: "UNPAID", "PAID")
- `related_trx_id` (UUID, Foreign Key ke `transactions.id`)

## Keamanan (Row Level Security - RLS)
Setiap tabel mengimplementasikan RLS dengan aturan:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` hanya diizinkan jika `auth.uid() = umkm_id`.
- Dengan cara ini, satu warung tidak akan bisa melihat atau mengubah data warung lain.
