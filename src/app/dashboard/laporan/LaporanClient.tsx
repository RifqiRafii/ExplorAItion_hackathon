'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UserSession, Product, Debt } from '@/types';
import {
  Transaction,
  PeriodeFilter,
  filterByPeriode,
  hitungRingkasan,
  hitungLabaRugi,
  hitungPiutang,
  hitungNilaiPersediaan,
  buatBukuBesar
} from '@/lib/ledger';
import { deleteTransaction } from '@/app/actions/transaksi';

interface LaporanClientProps {
  user: UserSession | null;
  initialTransactions: Transaction[];
  products: Product[];
  debts: Debt[];
}

export default function LaporanClient({ user, initialTransactions, products, debts }: LaporanClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [periode, setPeriode] = useState<PeriodeFilter>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Tab View: Riwayat Transaksi Rinci vs Jurnal Buku Besar
  const [viewTab, setViewTab] = useState<'RIWAYAT' | 'JURNAL'>('RIWAYAT');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter transactions
  const filteredTrx = filterByPeriode(transactions, periode, customStart, customEnd);
  
  // Specific Type Filter for Riwayat view
  const displayTrx = filteredTrx.filter(t => {
    if (filterType === 'IN') return t.type === 'IN';
    if (filterType === 'OUT') return t.type === 'OUT';
    return true;
  });

  // Computations
  const ringkasan = hitungRingkasan(filteredTrx);
  const labaRugi = hitungLabaRugi(filteredTrx);
  const piutang = hitungPiutang(debts);
  const persediaan = hitungNilaiPersediaan(products);
  const bukuBesar = buatBukuBesar(filteredTrx, 0);
  
  const handlePrint = () => {
    window.print();
  };

  const handleDeleteTrx = async (trxId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang akan dikembalikan otomatis ke inventaris.')) {
      return;
    }

    setDeletingId(trxId);
    try {
      const res = await deleteTransaction(trxId, true);
      if (res.error) {
        alert(res.error);
      } else {
        setTransactions(prev => prev.filter(t => t.id !== trxId));
      }
    } catch (err: any) {
      alert('Gagal menghapus transaksi: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getPeriodeLabel = (p: PeriodeFilter) => {
    switch(p) {
      case 'ALL': return 'Semua Waktu';
      case 'THIS_MONTH': return 'Bulan Ini';
      case 'LAST_MONTH': return 'Bulan Lalu';
      case 'LAST_3_MONTHS': return '3 Bulan Terakhir';
      case 'CUSTOM': 
        if (customStart && customEnd) {
          return `${new Date(customStart).toLocaleDateString('id-ID')} - ${new Date(customEnd).toLocaleDateString('id-ID')}`;
        }
        return 'Kustom';
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto print:max-w-none print:w-full print:bg-white print:text-black pb-12">
      
      {/* HEADER PRINT ONLY */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">{user?.store_name || user?.warung_name || 'Warung Berkah'}</h1>
        <p className="text-sm">Laporan Keuangan, Pembukuan &amp; Riwayat Transaksi</p>
        <p className="text-sm mt-1">Periode: {getPeriodeLabel(periode)}</p>
        <p className="text-xs mt-1 italic">Tanggal Cetak: {todayStr}</p>
      </div>

      {/* FILTER & ACTIONS (HIDDEN ON PRINT) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="font-headline-lg font-bold text-on-surface">Buku Besar &amp; Pembukuan</h1>
          <p className="text-on-surface-variant text-sm">Lihat ringkasan arus kas, laba rugi, dan riwayat transaksi pembukuan.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/transaksi"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">point_of_sale</span>
            + Input Transaksi / Kasir
          </Link>

          <div className="flex items-center gap-2">
            <select 
              value={periode}
              onChange={(e) => setPeriode(e.target.value as PeriodeFilter)}
              className="px-3.5 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="LAST_3_MONTHS">3 Bulan Terakhir</option>
              <option value="CUSTOM">Kustom (Dari-Sampai)</option>
            </select>
            
            {periode === 'CUSTOM' && (
              <div className="flex gap-1.5 items-center">
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 bg-surface-container-low border border-outline/20 rounded-xl text-xs focus:outline-none"
                />
                <span className="text-xs font-bold">-</span>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 bg-surface-container-low border border-outline/20 rounded-xl text-xs focus:outline-none"
                />
              </div>
            )}

            <button 
              onClick={handlePrint}
              className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-outline/20 text-on-surface font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak PDF / Print"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Kas Masuk (Penjualan)</p>
          <p className="text-xl font-bold text-emerald-600 print:text-black">Rp {ringkasan.kasMasuk.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Kas Keluar (Kulakan/Beli)</p>
          <p className="text-xl font-bold text-error print:text-black">Rp {ringkasan.kasKeluar.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Selisih Kas Bersih</p>
          <p className="text-xl font-bold text-primary print:text-black">Rp {ringkasan.selisih.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Estimasi Laba Bersih</p>
          <p className="text-xl font-bold text-emerald-600 print:text-black">Rp {labaRugi.labaBersih.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* DETAILS GRID (Laba Rugi & Aset) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Laba Rugi */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline/20 p-5 print:border-none print:p-0">
          <h2 className="font-bold mb-4 uppercase text-sm print:text-lg border-b pb-2 print:border-black">Laporan Laba Rugi</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total Penjualan</span>
              <span className="font-bold">Rp {labaRugi.penjualan.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-error print:text-black">
              <span>Harga Pokok (Kulakan)</span>
              <span>- Rp {labaRugi.hpp.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-outline/10 pt-2 print:border-black">
              <span>Laba Kotor</span>
              <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-error print:text-black">
              <span>Biaya Operasional</span>
              <span>- Rp {labaRugi.biaya.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 print:text-black border-t-2 border-outline/20 pt-2 print:border-black">
              <span>Laba Bersih</span>
              <span>Rp {labaRugi.labaBersih.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Posisi Aset */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline/20 p-5 print:border-none print:p-0">
          <h2 className="font-bold mb-4 uppercase text-sm print:text-lg border-b pb-2 print:border-black">Posisi Piutang &amp; Persediaan</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Total Piutang (Kasbon)</span>
              <span className="font-bold text-error print:text-black">Rp {piutang.totalAktif.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant print:text-black">
              <span>Jumlah Pelanggan Ngutang</span>
              <span>{piutang.jumlahPelanggan} Orang</span>
            </div>
            <div className="flex justify-between mt-4">
              <span>Estimasi Nilai Persediaan</span>
              <span className="font-bold text-primary print:text-black">Rp {persediaan.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant print:text-black">
              <span>Jumlah SKU Tersedia</span>
              <span>{products.length} Macam</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS & JURNAL SECTION */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 overflow-hidden print:border-black print:rounded-none shadow-sm">
        
        {/* Section Header with Tab Switcher */}
        <div className="p-4 border-b border-outline/15 bg-surface-container-low print:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('RIWAYAT')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewTab === 'RIWAYAT'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>Riwayat Transaksi Lengkap ({displayTrx.length})</span>
            </button>
            <button
              onClick={() => setViewTab('JURNAL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewTab === 'JURNAL'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              <span>Buku Besar Jurnal Kas ({bukuBesar.length})</span>
            </button>
          </div>

          {/* Sub-filter for Riwayat */}
          {viewTab === 'RIWAYAT' && (
            <div className="flex items-center gap-1 print:hidden">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filterType === 'ALL' ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('IN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filterType === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Penjualan (Kas Masuk)
              </button>
              <button
                onClick={() => setFilterType('OUT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filterType === 'OUT' ? 'bg-amber-100 text-amber-800' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Kulakan (Kas Keluar)
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: RIWAYAT TRANSAKSI RINCI */}
        {viewTab === 'RIWAYAT' && (
          <div>
            {displayTrx.length > 0 ? (
              <div className="divide-y divide-outline/10">
                {displayTrx.map((trx) => {
                  const isSale = trx.type === 'IN';
                  const dateStr = new Date(trx.transaction_date || trx.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={trx.id} className="p-4 hover:bg-surface-container-low/25 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              isSale
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isSale ? 'Penjualan' : 'Kulakan / Restock'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              trx.payment_method === 'CASH'
                                ? 'bg-surface-container text-on-surface'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {trx.payment_method === 'CASH' ? 'Tunai (CASH)' : 'Kasbon (Kredit)'}
                          </span>

                          <span className="text-xs text-on-surface-variant font-medium">
                            {dateStr}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`font-extrabold text-base ${isSale ? 'text-emerald-600' : 'text-error'}`}>
                            {isSale ? '+' : '-'} Rp {trx.total_amount.toLocaleString('id-ID')}
                          </span>

                          <button
                            type="button"
                            disabled={deletingId === trx.id}
                            onClick={() => handleDeleteTrx(trx.id)}
                            className="text-xs text-on-surface-variant hover:text-error transition-colors p-1 print:hidden cursor-pointer"
                            title="Batalkan transaksi ini dan kembalikan stok"
                          >
                            {deletingId === trx.id ? (
                              <span className="text-[10px]">Menghapus...</span>
                            ) : (
                              <span className="material-symbols-outlined text-base">delete</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Items Purchased List */}
                      {trx.items && trx.items.length > 0 ? (
                        <div className="mt-2 bg-surface-container-low/30 rounded-xl p-2.5 text-xs space-y-1">
                          <span className="font-bold text-[11px] text-on-surface-variant block mb-1">
                            Rincian Barang yang Dibeli:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {trx.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-surface-container-lowest p-2 rounded-lg border border-outline/10">
                                <span className="font-medium text-on-surface truncate pr-2">
                                  {item.name} &times; {item.quantity || 1} {item.unit || 'Pcs'}
                                </span>
                                <span className="font-bold text-on-surface shrink-0">
                                  Rp {((item.quantity || 1) * (item.price || item.costPrice || 0)).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant italic mt-1">
                          {trx.category || 'Transaksi Umum'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl opacity-40 mb-2">receipt_long</span>
                <p className="font-bold text-sm">Belum ada catatan riwayat transaksi di periode ini.</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Mulai input transaksi penjualan melalui menu Kasir agar stok otomatis terpotong.
                </p>
                <Link
                  href="/dashboard/transaksi"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-sm">point_of_sale</span>
                  Buka Kasir &amp; Input Transaksi
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JURNAL BUKU BESAR */}
        {viewTab === 'JURNAL' && (
          <div>
            {bukuBesar.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-outline/20 print:border-black bg-surface-container-low/50 print:bg-white text-xs">
                      <th className="p-3 font-bold">Tanggal</th>
                      <th className="p-3 font-bold">Keterangan</th>
                      <th className="p-3 font-bold text-right">Masuk (Debit)</th>
                      <th className="p-3 font-bold text-right">Keluar (Kredit)</th>
                      <th className="p-3 font-bold text-right">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10 print:divide-black text-xs">
                    {bukuBesar.map((row, idx) => (
                      <tr key={idx} className="print:break-inside-avoid hover:bg-surface-container-low/20">
                        <td className="p-3 whitespace-nowrap">
                          {new Date(row.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">{row.keterangan}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {row.masuk > 0 ? `Rp ${row.masuk.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-error">
                          {row.keluar > 0 ? `Rp ${row.keluar.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-on-surface">
                          Rp {row.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-4xl opacity-50 mb-2">account_balance_wallet</span>
                <p>Belum ada mutasi jurnal kas di periode ini.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER PRINT ONLY */}
      <div className="hidden print:block mt-8 pt-4 border-t border-black text-center text-xs italic">
        Laporan dibuat otomatis dari catatan transaksi WarungCopilot.<br/>
        Angka bergantung pada kelengkapan pencatatan transaksi kasir.
      </div>
      
      {/* GLOBAL PRINT CSS FIX */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside, header, nav { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
