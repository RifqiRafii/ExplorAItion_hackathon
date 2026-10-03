import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import PiutangClient from './PiutangClient';
import type { Debt, UserSession } from '@/types';

export default async function PiutangPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let debts: Debt[] = [];
  
  if (sessionCookie) {
    try {
      const user: UserSession = JSON.parse(sessionCookie);
      if (user?.id) {
        const { data } = await supabase
          .from('debts')
          .select('*')
          .eq('umkm_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) debts = data;
      }
    } catch (e) {
      console.error('Error parsing session in PiutangPage:', e);
    }
  }

  return <PiutangClient initialDebts={debts} />;
}
