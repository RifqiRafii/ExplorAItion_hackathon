import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Debt, Product, UserSession } from '@/types';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let user: UserSession | null = null;
  let debts: Debt[] = [];
  let products: Product[] = [];

  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie);
      if (user?.id) {
        const [debtsRes, productsRes] = await Promise.all([
          supabase.from('debts').select('*').eq('umkm_id', user.id),
          supabase.from('products').select('*').eq('umkm_id', user.id)
        ]);
        if (debtsRes.data) debts = debtsRes.data;
        if (productsRes.data) products = productsRes.data;
      }
    } catch (e) {
      console.error('Error in DashboardPage:', e);
    }
  }

  const totalPiutang = debts
    .filter(d => d.status === 'UNPAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalNilaiStok = products
    .reduce((acc, curr) => acc + (curr.price * curr.stock), 0);

  const lowStockItems = products
    .filter(p => p.stock <= p.min_stock);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>{user?.store_name || user?.warung_name || 'Warung Anda'} &bull; Live Monitor</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
            Ringkasan Keuangan & Stok
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Selamat datang, <span className="font-bold text-on-surface">{user?.owner_name || 'Juragan'}</span>! Berikut ringkasan aset riil warung Anda.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/stok"
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Kelola Stok
          </Link>
          <Link
            href="/dashboard/piutang"
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            Buku Piutang
          </Link>
          <Link
            href="/dashboard/chat"
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            Tanya Copilot AI
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pb-space-lg">
        {/* Metric 1: Nilai Aset Stok */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">inventory_2</span>
                <span className="font-label-sm uppercase text-on-surface-variant font-bold">Nilai Aset Stok</span>
              </div>
              <span className="text-xs bg-surface-container px-2 py-0.5 rounded-full font-bold text-on-surface-variant">
                {products.length} SKU
              </span>
            </div>
            <div className="font-currency-display text-primary font-extrabold tracking-tight text-3xl">
              Rp {totalNilaiStok.toLocaleString('id-ID')}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline/10">
            Total modal barang yang tersimpan di etalase & gudang.
          </p>
        </div>

        {/* Metric 2: Piutang Aktif */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error p-2 bg-error-container/40 rounded-xl">menu_book</span>
                <span className="font-label-sm uppercase text-error font-bold">Piutang / Kasbon Aktif</span>
              </div>
              <span className="text-xs bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-bold">
                {debts.filter(d => d.status === 'UNPAID').length} Orang
              </span>
            </div>
            <div className="font-currency-display text-error font-extrabold tracking-tight text-3xl">
              Rp {totalPiutang.toLocaleString('id-ID')}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline/10">
            Uang kas warung yang tertahan di pelanggan.
          </p>
        </div>

        {/* Metric 3: Stok Menipis */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 p-2 bg-amber-500/10 rounded-xl">warning</span>
                <span className="font-label-sm uppercase text-on-surface-variant font-bold">Barang Perlu Restock</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {lowStockItems.length > 0 ? 'Perhatian' : 'Aman'}
              </span>
            </div>
            <div className={`font-currency-display font-extrabold tracking-tight text-3xl ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockItems.length} Barang
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline/10">
            Jumlah barang dengan sisa di bawah batas aman restock.
          </p>
        </div>
      </div>

      {/* AI Smart Action / Alerts */}
      <div className="mb-space-lg">
        <h2 className="font-headline-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span>
          Rekomendasi Pintar AI Copilot
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alert Stok */}
          {lowStockItems.length > 0 ? (
            <div className="p-space-md rounded-2xl bg-surface-container-lowest border-l-4 border-amber-500 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-label-md font-bold text-amber-600 mb-1">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Peringatan Stok Menipis
                </div>
                <p className="text-body-md text-on-surface">
                  Barang seperti <strong>{lowStockItems.slice(0, 3).map(p => `${p.name} (${p.stock} ${p.unit})`).join(', ')}</strong> sudah mencapai batas minimum.
                </p>
              </div>
              <Link 
                href="/dashboard/stok" 
                className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start"
              >
                Buka Inventaris & Restock <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="p-space-md rounded-2xl bg-surface-container-lowest border-l-4 border-emerald-500 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-label-md font-bold text-emerald-600 mb-1">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Stok Barang Terkendali
                </div>
                <p className="text-body-md text-on-surface">
                  {products.length > 0 
                    ? 'Semua barang inventaris saat ini berada di atas batas minimum stok.' 
                    : 'Belum ada data barang. Tambahkan barang warung Anda agar AI bisa memantau stok.'}
                </p>
              </div>
              <Link 
                href="/dashboard/stok" 
                className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start"
              >
                {products.length > 0 ? 'Lihat Semua Barang' : 'Tambah Barang Pertama'} <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Alert Piutang */}
          {totalPiutang > 0 ? (
            <div className="p-space-md rounded-2xl bg-surface-container-lowest border-l-4 border-error shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-label-md font-bold text-error mb-1">
                  <span className="material-symbols-outlined text-base">alarm</span>
                  Kas Tertahan di Kasbon
                </div>
                <p className="text-body-md text-on-surface">
                  Ada Rp {totalPiutang.toLocaleString('id-ID')} piutang belum tertagih. Segera kirimkan pengingat WhatsApp santai agar kas tidak macet.
                </p>
              </div>
              <Link 
                href="/dashboard/piutang" 
                className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start"
              >
                Buka Buku Piutang & Tagih WA <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="p-space-md rounded-2xl bg-surface-container-lowest border-l-4 border-primary shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-label-md font-bold text-primary mb-1">
                  <span className="material-symbols-outlined text-base">verified</span>
                  Kas Lancar (Nol Piutang Tertunggak)
                </div>
                <p className="text-body-md text-on-surface">
                  Tidak ada catatan kasbon macet. Arus kas harian warung berjalan sehat!
                </p>
              </div>
              <Link 
                href="/dashboard/piutang" 
                className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start"
              >
                Catat Piutang Baru <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
