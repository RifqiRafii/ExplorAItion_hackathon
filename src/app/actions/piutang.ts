'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { UserSession } from '@/types';

async function getUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  if (!sessionCookie) return null;
  try {
    const parsed: UserSession = JSON.parse(sessionCookie);
    if (!parsed?.id) return null;

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, store_name, owner_name, phone_number')
      .eq('id', parsed.id)
      .single();

    if (dbUser) {
      return dbUser as UserSession;
    }

    if (parsed.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, email, store_name, owner_name, phone_number')
        .eq('email', parsed.email)
        .single();

      if (emailUser) {
        cookieStore.set('userSession', JSON.stringify(emailUser), {
          httpOnly: true,
          maxAge: 24 * 60 * 60,
        });
        return emailUser as UserSession;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function addDebt(formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi akun tidak ditemukan di database. Silakan logout lalu login kembali.' };
  }

  const customer_name = formData.get('customer_name') as string;
  const customer_phone = (formData.get('customer_phone') as string) || '';
  const amount = parseInt((formData.get('amount') as string) || '0', 10);
  const due_date = formData.get('due_date') as string;

  if (!customer_name || !amount || !due_date) {
    return { error: 'Nama pelanggan, jumlah utang, dan tanggal jatuh tempo wajib diisi.' };
  }

  const { error } = await supabase
    .from('debts')
    .insert([
      {
        umkm_id: user.id,
        customer_name,
        customer_phone,
        amount,
        due_date: new Date(due_date).toISOString(),
        status: 'UNPAID',
      }
    ]);

  if (error) {
    console.error('Error adding debt:', error);
    if (error.code === '23503') {
      return { 
        error: 'Foreign key database belum diperbarui. Silakan jalankan script database/fix_foreign_keys.sql di SQL Editor Supabase Anda.' 
      };
    }
    return { error: 'Gagal menyimpan catatan piutang: ' + error.message };
  }

  revalidatePath('/dashboard/piutang');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleDebtStatus(debtId: string, currentStatus: 'UNPAID' | 'PAID') {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi telah berakhir. Silakan login kembali.' };
  }

  const newStatus: 'UNPAID' | 'PAID' = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';

  const { error } = await supabase
    .from('debts')
    .update({ status: newStatus })
    .eq('id', debtId)
    .eq('umkm_id', user.id);

  if (error) {
    console.error('Error updating debt status:', error);
    return { error: 'Gagal memperbarui status: ' + error.message };
  }

  revalidatePath('/dashboard/piutang');
  revalidatePath('/dashboard');
  return { success: true, newStatus };
}

export async function deleteDebt(debtId: string) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi telah berakhir. Silakan login kembali.' };
  }

  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', debtId)
    .eq('umkm_id', user.id);

  if (error) {
    console.error('Error deleting debt:', error);
    return { error: 'Gagal menghapus catatan: ' + error.message };
  }

  revalidatePath('/dashboard/piutang');
  revalidatePath('/dashboard');
  return { success: true };
}
