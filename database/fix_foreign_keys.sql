-- SCRIPT PERBAIKAN FOREIGN KEY (Jalankan di SQL Editor Supabase)
-- Masalah: Tabel products & debts lama masih merujuk ke 'umkm_profiles' bukan 'users'.
-- Script ini memperbarui foreign key agar mengarah ke tabel 'users' yang benar.

-- 1. Perbarui foreign key tabel products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_umkm_id_fkey;
ALTER TABLE public.products 
  ADD CONSTRAINT products_umkm_id_fkey 
  FOREIGN KEY (umkm_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Perbarui foreign key tabel debts
ALTER TABLE public.debts DROP CONSTRAINT IF EXISTS debts_umkm_id_fkey;
ALTER TABLE public.debts 
  ADD CONSTRAINT debts_umkm_id_fkey 
  FOREIGN KEY (umkm_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Perbarui foreign key tabel transactions
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_umkm_id_fkey;
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_umkm_id_fkey 
  FOREIGN KEY (umkm_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Pastikan Policy RLS mengizinkan insert/update untuk anon
DROP POLICY IF EXISTS "Allow all for products" ON public.products;
CREATE POLICY "Allow all for products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for debts" ON public.debts;
CREATE POLICY "Allow all for debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

