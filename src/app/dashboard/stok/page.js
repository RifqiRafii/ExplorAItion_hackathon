import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export default async function StokPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let products = [];
  
  if (sessionCookie) {
    const user = JSON.parse(sessionCookie);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('umkm_id', user.id)
      .order('name', { ascending: true });
    
    if (data) products = data;
  }

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
            Stok & Restock
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Pantau ketersediaan barang di warung Anda. Dapatkan peringatan otomatis jika stok mulai habis!
          </p>
        </div>
        
        {lowStockProducts.length > 0 && (
          <div className="bg-error-container border border-error p-space-md rounded-2xl flex flex-col min-w-[250px] shadow-sm">
            <span className="flex items-center gap-2 font-label-sm uppercase text-on-error-container font-bold mb-1">
              <span className="material-symbols-outlined text-sm">warning</span> Stok Menipis
            </span>
            <span className="font-headline-sm text-error font-extrabold">{lowStockProducts.length} Barang</span>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm overflow-hidden">
        <div className="p-space-md border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
          <h2 className="font-headline-sm font-bold text-on-surface">Inventaris Barang</h2>
          <div className="flex gap-2">
            <button className="bg-surface-container hover:bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-xl font-bold flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span> Scan Barcode
            </button>
            <button className="bg-primary hover:bg-primary/90 text-on-primary px-space-md py-space-sm rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">add</span> Tambah Barang
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline/20">
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Nama Barang</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Harga Jual</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Stok Saat Ini</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Batas Minimum</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {products.length > 0 ? (
                products.map((product) => {
                  const isLowStock = product.stock <= product.min_stock;
                  return (
                    <tr key={product.id} className={`hover:bg-surface-container/30 transition-colors ${isLowStock ? 'bg-error-container/10' : ''}`}>
                      <td className="p-space-md font-body-lg text-on-surface font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline-variant text-3xl">inventory_2</span>
                        {product.name}
                      </td>
                      <td className="p-space-md font-body-lg text-primary font-bold">Rp {product.price.toLocaleString('id-ID')}</td>
                      <td className={`p-space-md font-headline-sm text-center font-extrabold ${isLowStock ? 'text-error' : 'text-on-surface'}`}>
                        {product.stock} <span className="text-body-sm font-normal text-on-surface-variant">{product.unit}</span>
                      </td>
                      <td className="p-space-md font-body-md text-on-surface-variant text-center">{product.min_stock} {product.unit}</td>
                      <td className="p-space-md text-center">
                        <span className={`px-3 py-1 rounded-full font-label-sm font-bold inline-block ${isLowStock ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                          {isLowStock ? 'PERLU RESTOCK' : 'AMAN'}
                        </span>
                      </td>
                      <td className="p-space-md text-right">
                        <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-space-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-5xl opacity-50">kitchen</span>
                      <p className="font-label-lg">Belum ada barang di inventaris Anda.</p>
                      <p className="text-body-sm">Klik Tambah Barang untuk memulai mencatat stok warung Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
