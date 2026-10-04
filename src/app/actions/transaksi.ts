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

export interface CartItemInput {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  costPrice?: number;
}

export interface CreateSaleInput {
  items: CartItemInput[];
  paymentMethod: 'CASH' | 'CREDIT';
  customerName?: string;
  customerPhone?: string;
  dueDate?: string;
  notes?: string;
  paidAmount?: number;
  transactionDate?: string;
}

/**
 * Mencatat transaksi penjualan (pembelian oleh pelanggan):
 * 1. Validasi ketersediaan stok
 * 2. Kurangi stok produk secara otomatis
 * 3. Jika Kasbon/Kredit, buat record di tabel debts
 * 4. Catat ke tabel transactions (Buku Besar & Pembukuan)
 */
export async function createSaleTransaction(input: CreateSaleInput) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi akun tidak ditemukan. Silakan login kembali.' };
  }

  const { items, paymentMethod, customerName, customerPhone, dueDate, notes, transactionDate } = input;

  if (!items || items.length === 0) {
    return { error: 'Keranjang belanja kosong. Pilih minimal 1 barang.' };
  }

  // Validasi jumlah dan harga
  for (const item of items) {
    if (!item.productId || item.quantity <= 0 || item.price < 0) {
      return { error: `Data barang "${item.name || 'Barang'}" tidak valid.` };
    }
  }

  // 1. Ambil data produk terbaru dari database untuk verifikasi stok
  const productIds = items.map(i => i.productId);
  const { data: dbProducts, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('umkm_id', user.id);

  if (fetchErr || !dbProducts) {
    console.error('Error fetching products for sale:', fetchErr);
    return { error: 'Gagal memverifikasi stok barang dari database.' };
  }

  // Peta produk
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  // Validasi ketersediaan stok
  for (const item of items) {
    const p = productMap.get(item.productId);
    if (!p) {
      return { error: `Barang "${item.name}" tidak ditemukan di database warung Anda.` };
    }
    if (p.stock < item.quantity) {
      return { 
        error: `Stok tidak mencukupi untuk "${p.name}". Sisa stok saat ini hanya ${p.stock} ${p.unit}, tidak cukup untuk ${item.quantity} ${p.unit}.` 
      };
    }
  }

  // Hitung total belanja
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  // 2. Kurangi stok masing-masing barang di database
  const updatedStocks: { id: string; name: string; newStock: number; unit: string }[] = [];
  for (const item of items) {
    const p = productMap.get(item.productId)!;
    const newStock = Math.max(0, p.stock - item.quantity);

    const { error: stockErr } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', p.id)
      .eq('umkm_id', user.id);

    if (stockErr) {
      console.error(`Gagal mengurangi stok untuk produk ${p.name}:`, stockErr);
      return { error: `Gagal memperbarui stok untuk "${p.name}". Transaksi dibatalkan.` };
    }

    updatedStocks.push({ id: p.id, name: p.name, newStock, unit: p.unit });
  }

  // 3. Jika metode kredit/kasbon, buat piutang di tabel debts
  let createdDebtId: string | null = null;
  if (paymentMethod === 'CREDIT') {
    if (!customerName || !customerName.trim()) {
      return { error: 'Nama pelanggan wajib diisi untuk transaksi Kasbon/Kredit.' };
    }

    const finalDueDate = dueDate 
      ? new Date(dueDate).toISOString() 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default 7 hari

    const { data: newDebt, error: debtErr } = await supabase
      .from('debts')
      .insert([
        {
          umkm_id: user.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone?.trim() || null,
          amount: totalAmount,
          due_date: finalDueDate,
          status: 'UNPAID',
        }
      ])
      .select('id')
      .single();

    if (debtErr) {
      console.error('Error creating debt for credit sale:', debtErr);
      // Catatan: tidak membatalkan penjualan jika utang gagal, namun beri log
    } else if (newDebt) {
      createdDebtId = newDebt.id;
    }
  }

  // 4. Catat transaksi ke tabel transactions (Masuk Buku Besar & Pembukuan)
  const trxItems = items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    unit: item.unit || 'Pcs',
    subtotal: item.quantity * item.price
  }));

  const nowIso = new Date().toISOString();
  const trxDate = transactionDate ? new Date(transactionDate).toISOString() : nowIso;

  const { data: newTrx, error: trxErr } = await supabase
    .from('transactions')
    .insert([
      {
        umkm_id: user.id,
        type: 'IN',
        payment_method: paymentMethod,
        total_amount: totalAmount,
        items: trxItems,
        debt_id: createdDebtId,
        created_at: nowIso,
      }
    ])
    .select('id, created_at')
    .single();

  if (trxErr) {
    console.error('Error saving transaction record:', trxErr);
    return { 
      error: 'Stok berhasil dikurangi, tetapi gagal menyimpan catatan riwayat transaksi: ' + trxErr.message 
    };
  }

  // 5. Update relasi debt ke transaction jika kasbon
  if (createdDebtId && newTrx?.id) {
    await supabase
      .from('debts')
      .update({ related_trx_id: newTrx.id })
      .eq('id', createdDebtId);
  }

  // Revalidate cache agar dashboard, stok, dan buku besar langsung terupdate
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transaksi');
  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard/laporan');
  revalidatePath('/dashboard/piutang');

  return {
    success: true,
    transactionId: newTrx?.id,
    totalAmount,
    itemCount: items.length,
    updatedStocks,
    debtId: createdDebtId,
    message: `Transaksi Rp ${totalAmount.toLocaleString('id-ID')} berhasil disimpan! Stok otomatis dikurangi dan dicatat ke Pembukuan.`
  };
}

/**
 * Mencatat transaksi kulakan/restock (pembelian stok dari supplier):
 * Otomatis MENAMBAH stok produk dan mencatat Kas Keluar (HPP) ke pembukuan
 */
export async function createRestockTransaction(input: {
  items: { productId: string; name: string; quantity: number; costPrice: number; unit?: string }[];
  supplierName?: string;
  notes?: string;
  transactionDate?: string;
}) {
  const user = await getUser();
  if (!user) {
    return { error: 'Sesi akun tidak ditemukan. Silakan login kembali.' };
  }

  const { items, supplierName, transactionDate } = input;
  if (!items || items.length === 0) {
    return { error: 'Daftar barang kulakan kosong.' };
  }

  const productIds = items.map(i => i.productId);
  const { data: dbProducts, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('umkm_id', user.id);

  if (fetchErr || !dbProducts) {
    return { error: 'Gagal mengambil data barang dari database.' };
  }

  const productMap = new Map(dbProducts.map(p => [p.id, p]));
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  // Tambah stok barang
  for (const item of items) {
    const p = productMap.get(item.productId);
    if (p) {
      const newStock = p.stock + item.quantity;
      await supabase
        .from('products')
        .update({ 
          stock: newStock,
          cost_price: item.costPrice > 0 ? item.costPrice : p.cost_price 
        })
        .eq('id', p.id)
        .eq('umkm_id', user.id);
    }
  }

  // Catat transaksi kas keluar (KULAKAN)
  const trxItems = items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    costPrice: item.costPrice,
    unit: item.unit || 'Pcs',
    subtotal: item.quantity * item.costPrice
  }));

  const nowIso = new Date().toISOString();
  const trxDate = transactionDate ? new Date(transactionDate).toISOString() : nowIso;

  const { data: newTrx, error: trxErr } = await supabase
    .from('transactions')
    .insert([
      {
        umkm_id: user.id,
        type: 'OUT',
        payment_method: 'CASH',
        total_amount: totalAmount,
        items: trxItems,
        created_at: nowIso,
      }
    ])
    .select('id, created_at')
    .single();

  if (trxErr) {
    return { error: 'Gagal mencatat transaksi kulakan ke pembukuan: ' + trxErr.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transaksi');
  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard/laporan');

  return {
    success: true,
    transactionId: newTrx?.id,
    totalAmount,
    message: `Kulakan Rp ${totalAmount.toLocaleString('id-ID')} berhasil dicatat! Stok otomatis ditambah.`
  };
}

/**
 * Hapus transaksi dan kembalikan stok (opsional bila salah input)
 */
export async function deleteTransaction(transactionId: string, revertStock: boolean = true) {
  const user = await getUser();
  if (!user) return { error: 'Sesi akun berakhir.' };

  // Ambil transaksi lama
  const { data: trx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('umkm_id', user.id)
    .single();

  if (fetchErr || !trx) {
    return { error: 'Transaksi tidak ditemukan.' };
  }

  // Jika revertStock aktif dan tipe penjualan, kembalikan stok
  if (revertStock && trx.items && Array.isArray(trx.items)) {
    for (const item of trx.items) {
      if (item.productId && item.quantity) {
        const { data: p } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .eq('umkm_id', user.id)
          .single();

        if (p) {
          const restoredStock = trx.type === 'IN' 
            ? p.stock + item.quantity  // Kembalikan stok yang sebelumnya dikurangi
            : Math.max(0, p.stock - item.quantity); // Kurangi kembali stok yang sebelumnya ditambah

          await supabase
            .from('products')
            .update({ stock: restoredStock })
            .eq('id', item.productId)
            .eq('umkm_id', user.id);
        }
      }
    }
  }

  // Hapus catatan debt jika ada
  if (trx.debt_id) {
    await supabase.from('debts').delete().eq('id', trx.debt_id).eq('umkm_id', user.id);
  }

  // Hapus transaksi
  const { error: delErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('umkm_id', user.id);

  if (delErr) {
    return { error: 'Gagal menghapus transaksi: ' + delErr.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/transaksi');
  revalidatePath('/dashboard/stok');
  revalidatePath('/dashboard/laporan');
  revalidatePath('/dashboard/piutang');

  return { success: true, message: 'Transaksi berhasil dibatalkan dan stok telah disesuaikan kembali.' };
}
