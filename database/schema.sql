-- Script SQL untuk WarungCopilot
-- Jalankan script ini di SQL Editor Supabase Anda (Ganti script sebelumnya)

-- Hapus tabel lama jika ingin mengulang dari awal (uncomment jika perlu)
-- DROP TABLE IF EXISTS public.debts CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 1. users (Tabel custom pengganti Supabase Auth + Profil)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  store_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. products (Inventaris Stok)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  umkm_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  cost_price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. debts (Buku Piutang / Bon)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  umkm_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('UNPAID', 'PAID')),
  related_trx_id UUID -- Akan di-link ke transactions setelah tabelnya dibuat
);

-- 4. transactions (Mutasi Transaksi)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  umkm_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT CHECK (type IN ('IN', 'OUT')),
  category TEXT,
  payment_method TEXT CHECK (payment_method IN ('CASH', 'CREDIT')),
  total_amount INTEGER NOT NULL,
  items JSONB NOT NULL,
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL
);

-- Menambahkan Foreign Key untuk related_trx_id di tabel debts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_debts_trx') THEN
        ALTER TABLE public.debts 
          ADD CONSTRAINT fk_debts_trx 
          FOREIGN KEY (related_trx_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
    END IF;
END $$;


-- =========================================================================
-- MENGAKTIFKAN ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- MEMBUAT KEBIJAKAN (POLICIES) UNTUK HACKATHON (Akses Bebas Sementara)
-- Karena kita menggunakan custom users table (bukan auth.users bawaan Supabase),
-- RLS tidak bisa membaca auth.uid() secara native dari request client.
-- Untuk kemudahan Hackathon, kita izinkan anon key melakukan aksi CRUD.
-- (Proteksi dilakukan di sisi middleware Next.js)
-- =========================================================================

CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
