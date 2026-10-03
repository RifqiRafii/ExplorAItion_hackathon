'use client';

import { useState } from 'react';
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

interface LaporanClientProps {
  user: UserSession | null;
  initialTransactions: Transaction[];
  products: Product[];
  debts: Debt[];
}

export default function LaporanClient({ user, initialTransactions, products, debts }: LaporanClientProps) {
  const [periode, setPeriode] = useState<PeriodeFilter>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter transactions
  const filteredTrx = filterByPeriode(initialTransactions, periode, customStart, customEnd);
  
  // Computations
  const ringkasan = hitungRingkasan(filteredTrx);
  const labaRugi = hitungLabaRugi(filteredTrx);
  const piutang = hitungPiutang(debts);
  const persediaan = hitungNilaiPersediaan(products);
  const bukuBesar = buatBukuBesar(filteredTrx, 0); // Asumsi saldo awal 0 untuk simplifikasi
  
  const handlePrint = () => {
    window.print();
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
    <div className="flex flex-col w-full max-w-5xl mx-auto print:max-w-none print:w-full print:bg-white print:text-black">
      
      {/* HEADER PRINT ONLY */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">{user?.store_name || user?.warung_name || 'Warung Berkah'}</h1>
        <p className="text-sm">Laporan Keuangan & Buku Besar</p>
        <p className="text-sm mt-1">Periode: {getPeriodeLabel(periode)}</p>
        <p className="text-xs mt-1 italic">Tanggal Cetak: {todayStr}</p>
      </div>

      {/* FILTER & ACTIONS (HIDDEN ON PRINT) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="font-headline-lg font-bold text-on-surface">Buku Besar & Laporan</h1>
          <p className="text-on-surface-variant text-sm">Lihat ringkasan arus kas dan laba rugi otomatis.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select 
              value={periode}
              onChange={(e) => setPeriode(e.target.value as PeriodeFilter)}
              className="px-4 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm font-bold focus:outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="LAST_3_MONTHS">3 Bulan Terakhir</option>
              <option value="CUSTOM">Kustom (Dari-Sampai)</option>
            </select>
            
            {periode === 'CUSTOM' && (
              <div className="flex gap-2 items-center">
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none"
                />
                <span className="text-sm font-bold">-</span>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none"
                />
              </div>
            )}
          </div>

          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">print</span> Cetak / PDF
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Kas Masuk</p>
          <p className="text-xl font-bold text-emerald-600 print:text-black">Rp {ringkasan.kasMasuk.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Kas Keluar</p>
          <p className="text-xl font-bold text-error print:text-black">Rp {ringkasan.kasKeluar.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Selisih Kas</p>
          <p className="text-xl font-bold text-primary print:text-black">Rp {ringkasan.selisih.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline/20 print:border-black print:rounded-none">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Laba Bersih</p>
          <p className="text-xl font-bold text-emerald-600 print:text-black">Rp {labaRugi.labaBersih.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* DETAILS GRID */}
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
          <h2 className="font-bold mb-4 uppercase text-sm print:text-lg border-b pb-2 print:border-black">Posisi Piutang & Persediaan</h2>
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

      {/* BUKU BESAR TABLE */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline/20 overflow-hidden print:border-black print:rounded-none">
        <div className="p-4 border-b border-outline/20 print:border-black bg-surface-container-low print:bg-white">
          <h2 className="font-bold uppercase text-sm print:text-lg">Buku Besar Transaksi (Jurnal)</h2>
        </div>
        
        {bukuBesar.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline/20 print:border-black bg-surface-container-low/50 print:bg-white">
                  <th className="p-3 font-bold">Tanggal</th>
                  <th className="p-3 font-bold">Keterangan</th>
                  <th className="p-3 font-bold text-right">Masuk (Debit)</th>
                  <th className="p-3 font-bold text-right">Keluar (Kredit)</th>
                  <th className="p-3 font-bold text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 print:divide-black">
                {bukuBesar.map((row, idx) => (
                  <tr key={idx} className="print:break-inside-avoid">
                    <td className="p-3">{new Date(row.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3">{row.keterangan}</td>
                    <td className="p-3 text-right">{row.masuk > 0 ? `Rp ${row.masuk.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="p-3 text-right">{row.keluar > 0 ? `Rp ${row.keluar.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="p-3 text-right font-bold">Rp {row.saldo.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-50 mb-2">receipt_long</span>
            <p>Belum ada transaksi di periode ini.</p>
          </div>
        )}
      </div>

      {/* FOOTER PRINT ONLY */}
      <div className="hidden print:block mt-8 pt-4 border-t border-black text-center text-xs italic">
        Laporan dibuat otomatis dari catatan transaksi WarungCopilot.<br/>
        Angka bergantung pada kelengkapan pencatatan.
      </div>
      
      {/* GLOBAL PRINT CSS FIX */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          /* Hide sidebar and header */
          aside, header, nav { display: none !important; }
          /* Reset padding for main content area */
          main { padding: 0 !important; margin: 0 !important; margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
