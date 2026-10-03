import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { UserSession, Product, Debt } from '@/types';
import LaporanClient from './LaporanClient';

export default async function LaporanPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let user: UserSession | null = null;
  let transactions: any[] = [];
  let products: Product[] = [];
  let debts: Debt[] = [];

  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie);
      if (user?.id) {
        const [trxRes, prodRes, debtRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('umkm_id', user.id).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('umkm_id', user.id),
          supabase.from('debts').select('*').eq('umkm_id', user.id)
        ]);
        if (trxRes.data) transactions = trxRes.data;
        if (prodRes.data) products = prodRes.data;
        if (debtRes.data) debts = debtRes.data;
      }
    } catch (e) {
      console.error('Error fetching data for laporan:', e);
    }
  }

  return (
    <LaporanClient 
      user={user} 
      initialTransactions={transactions} 
      products={products} 
      debts={debts} 
    />
  );
}
