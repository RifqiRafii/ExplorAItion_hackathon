import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import StokClient from './StokClient';
import type { Product, UserSession } from '@/types';

export default async function StokPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let products: Product[] = [];
  
  if (sessionCookie) {
    try {
      const user: UserSession = JSON.parse(sessionCookie);
      if (user?.id) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('umkm_id', user.id)
          .order('name', { ascending: true });
        
        if (data) products = data;
      }
    } catch (e) {
      console.error('Error fetching products in StokPage:', e);
    }
  }

  return <StokClient initialProducts={products} />;
}
