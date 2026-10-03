# Database Schema (Local Storage)
Aplikasi WarungCopilot menggunakan `LocalStorage` untuk menyimpan data agar tetap bertahan di browser (Zero-build, tanpa backend terpisah untuk versi V1). Berikut adalah struktur skema data yang digunakan.

## 1. State: `cashBalance` (Saldo Kas)
Menyimpan total saldo kas aktual dalam bentuk angka (integer).
- **Key**: `warungcopilot_cash_balance`
- **Tipe Data**: `Number`
- **Contoh**: `1500000`

## 2. Koleksi: `products` (Inventaris Stok)
Menyimpan daftar barang yang dijual beserta informasi stok dan harga.
- **Key**: `warungcopilot_products`
- **Tipe Data**: `Array of Objects`
- **Struktur Object**:
  ```json
  {
    "id": "prod_001",
    "name": "Beras Premium 5kg",
    "price": 65000,
    "stock": 10,
    "minStock": 3,
    "unit": "sak"
  }
  ```

## 3. Koleksi: `transactions` (Mutasi Transaksi)
Menyimpan histori transaksi masuk (penjualan) dan keluar (kulakan).
- **Key**: `warungcopilot_transactions`
- **Tipe Data**: `Array of Objects`
- **Struktur Object**:
  ```json
  {
    "id": "trx_001",
    "date": "2026-10-03T10:00:00Z",
    "type": "IN", // "IN" (Penjualan), "OUT" (Kulakan/Pengeluaran)
    "paymentMethod": "CASH", // "CASH" atau "CREDIT" (Bon)
    "totalAmount": 195000,
    "items": [
      {
        "productId": "prod_001",
        "name": "Beras Premium 5kg",
        "qty": 3,
        "subtotal": 195000
      }
    ],
    "debtId": "debt_001" // Opsional, hanya jika paymentMethod = "CREDIT"
  }
  ```

## 4. Koleksi: `debts` (Buku Piutang / Bon)
Menyimpan catatan pelanggan yang berutang (kasbon).
- **Key**: `warungcopilot_debts`
- **Tipe Data**: `Array of Objects`
- **Struktur Object**:
  ```json
  {
    "id": "debt_001",
    "customerName": "Bu Siti",
    "customerPhone": "628123456789", // Untuk integrasi WA (opsional)
    "amount": 195000,
    "dateCreated": "2026-10-03T10:00:00Z",
    "dueDate": "2026-10-10T10:00:00Z", // Jatuh tempo (misal +7 hari)
    "status": "UNPAID", // "UNPAID" atau "PAID"
    "relatedTrxId": "trx_001"
  }
  ```
