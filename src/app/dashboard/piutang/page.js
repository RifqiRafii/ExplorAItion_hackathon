import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export default async function PiutangPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession')?.value;
  let debts = [];
  
  if (sessionCookie) {
    const user = JSON.parse(sessionCookie);
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('umkm_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) debts = data;
  }

  const totalPiutang = debts.filter(d => d.status === 'UNPAID').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
            Buku Piutang & Kasbon
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Kelola daftar utang pelanggan Anda. Jangan biarkan kas warung macet!
          </p>
        </div>
        
        <div className="bg-error-container/20 border border-error/20 p-space-md rounded-2xl flex flex-col min-w-[250px]">
          <span className="font-label-sm uppercase text-error font-bold mb-1">Total Piutang Belum Lunas</span>
          <span className="font-currency-display text-error font-extrabold">Rp {totalPiutang.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm overflow-hidden">
        <div className="p-space-md border-b border-outline/20 flex justify-between items-center bg-surface-container-lowest">
          <h2 className="font-headline-sm font-bold text-on-surface">Daftar Tagihan</h2>
          <button className="bg-primary hover:bg-primary/90 text-on-primary px-space-md py-space-sm rounded-xl font-bold flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-sm">add</span> Tambah Catatan
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline/20">
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Nama Pelanggan</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Nomor HP / WA</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Jumlah Kasbon</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Jatuh Tempo</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="p-space-md font-label-md font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {debts.length > 0 ? (
                debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="p-space-md font-body-lg text-on-surface font-semibold">{debt.customer_name}</td>
                    <td className="p-space-md font-body-md text-on-surface-variant">{debt.customer_phone || '-'}</td>
                    <td className="p-space-md font-body-lg text-error font-bold">Rp {debt.amount.toLocaleString('id-ID')}</td>
                    <td className="p-space-md font-body-md text-on-surface-variant">{new Date(debt.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="p-space-md">
                      <span className={`px-3 py-1 rounded-full font-label-sm font-bold ${debt.status === 'PAID' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                        {debt.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </span>
                    </td>
                    <td className="p-space-md text-right">
                      {debt.status === 'UNPAID' && (
                        <a 
                          href={`https://wa.me/${debt.customer_phone?.replace(/^0/, '62')}?text=Halo%20${debt.customer_name},%20ini%20pengingat%20tagihan%20kasbon%20sebesar%20Rp${debt.amount}%20yang%20jatuh%20tempo%20pada%20${new Date(debt.due_date).toLocaleDateString('id-ID')}.%20Terima%20kasih!`} 
                          target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1 font-label-md font-bold bg-primary/10 px-3 py-1.5 rounded-lg"
                        >
                          <span className="material-symbols-outlined text-sm">send</span> Tagih via WA
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-space-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-5xl opacity-50">receipt_long</span>
                      <p className="font-label-lg">Belum ada catatan piutang/kasbon.</p>
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
