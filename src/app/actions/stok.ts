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

    // Cek apakah user ada di database
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, store_name, owner_name, phone_number')
      .eq('id', parsed.id)
      .single();

    if (dbUser) {
      return dbUser as UserSession;
    }

    // Auto-heal: jika id berubah tapi email cocok
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

export async function addProduct(formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi akun tidak ditemukan di database. Silakan logout lalu login kembali.' };
  }

  const name = formData.get('name') as string;
  const price = parseInt((formData.get('price') as string) || '0', 10);
  const stock = parseInt((formData.get('stock') as string) || '0', 10);
  const min_stock = parseInt((formData.get('min_stock') as string) || '5', 10);
  const unit = (formData.get('unit') as string) || 'Pcs';

  if (!name || isNaN(price) || isNaN(stock)) {
    return { error: 'Nama barang, harga jual, dan stok awal wajib diisi.' };
  }

  const { error } = await supabase
    .from('products')
    .insert([
      {
        umkm_id: user.id,
        name,
        price,
        stock,
        min_stock,
        unit,
      }
    ]);

  if (error) {
    console.error('Error adding product:', error);
    if (error.code === '23503') {
      return { 
        error: 'Foreign key database belum diperbarui. Silakan jalankan script database/fix_foreign_keys.sql di SQL Editor Supabase Anda.' 
      };
    }
    return { error: 'Gagal menambah barang: ' + error.message };
  }

  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi telah berakhir. Silakan login kembali.' };
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const price = parseInt((formData.get('price') as string) || '0', 10);
  const stock = parseInt((formData.get('stock') as string) || '0', 10);
  const min_stock = parseInt((formData.get('min_stock') as string) || '5', 10);
  const unit = (formData.get('unit') as string) || 'Pcs';

  if (!id || !name) {
    return { error: 'ID dan nama barang wajib diisi.' };
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      price,
      stock,
      min_stock,
      unit,
    })
    .eq('id', id)
    .eq('umkm_id', user.id);

  if (error) {
    console.error('Error updating product:', error);
    return { error: 'Gagal memperbarui barang: ' + error.message };
  }

  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function adjustProductStock(productId: string, delta: number) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi telah berakhir. Silakan login kembali.' };
  }

  // Get current stock
  const { data: product, error: fetchErr } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .eq('umkm_id', user.id)
    .single();

  if (fetchErr || !product) {
    return { error: 'Barang tidak ditemukan.' };
  }

  const newStock = Math.max(0, product.stock + delta);

  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
    .eq('umkm_id', user.id);

  if (error) {
    console.error('Error adjusting stock:', error);
    return { error: 'Gagal mengubah stok: ' + error.message };
  }

  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard');
  return { success: true, newStock };
}

export async function deleteProduct(productId: string) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi telah berakhir. Silakan login kembali.' };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('umkm_id', user.id);

  if (error) {
    console.error('Error deleting product:', error);
    return { error: 'Gagal menghapus barang: ' + error.message };
  }

  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard');
  return { success: true };
}
