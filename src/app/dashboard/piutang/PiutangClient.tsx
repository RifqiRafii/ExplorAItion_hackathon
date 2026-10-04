'use client';

import { useState, FormEvent } from 'react';
import { addDebt, toggleDebtStatus, deleteDebt, updateLastBilled, updateDebtPhone, updateDebt } from '@/app/actions/piutang';
import { hitungHariTelat, buatPesanTagih, normalisasiNomor, linkWa } from '@/lib/penagih';
import type { Debt } from '@/types';

interface PiutangClientProps {
  initialDebts: Debt[];
}

export default function PiutangClient({ initialDebts = [] }: PiutangClientProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewDebt, setPreviewDebt] = useState<Debt | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [previewPhone, setPreviewPhone] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);

  // Default due date: 7 days from now
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const totalPiutang = debts
    .filter(d => d.status === 'UNPAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalLunas = debts
    .filter(d => d.status === 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredDebts = debts.filter(d => {
    const matchFilter = filter === 'ALL' || d.status === filter;
    const matchSearch = d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      Boolean(d.customer_phone?.includes(search));
    return matchFilter && matchSearch;
  });

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addDebt(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setLoading(false);
    } else {
      setSuccessMessage('Catatan piutang berhasil ditambahkan!');
      setIsModalOpen(false);
      form.reset();
      setLoading(false);
      window.location.reload();
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updateDebt(formData);

    if (res?.error) {
      setErrorMessage(res.error);
      setLoading(false);
    } else {
      setSuccessMessage('Catatan piutang berhasil diperbarui!');
      setIsEditModalOpen(false);
      form.reset();
      setLoading(false);
      window.location.reload();
    }
  };

  const handleToggleStatus = async (debt: Debt) => {
    const confirmText = debt.status === 'UNPAID' 
      ? `Tandai tagihan ${debt.customer_name} sebesar Rp ${debt.amount.toLocaleString('id-ID')} sebagai LUNAS?`
      : `Kembalikan tagihan ${debt.customer_name} ke status BELUM LUNAS?`;

    if (!confirm(confirmText)) return;

    const res = await toggleDebtStatus(debt.id, debt.status);
    if (res?.success && res.newStatus) {
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, status: res.newStatus as 'UNPAID' | 'PAID' } : d));
    } else if (res?.error) {
      alert(res.error);
    }
  };

  const handleDelete = async (debt: Debt) => {
    if (!confirm(`Yakin ingin menghapus catatan kasbon untuk ${debt.customer_name}?`)) return;

    const res = await deleteDebt(debt.id);
    if (res?.success) {
      setDebts(prev => prev.filter(d => d.id !== debt.id));
    } else if (res?.error) {
      alert(res.error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      {/* Header & Metric Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-2">
            Buku Piutang & Kasbon
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Kelola daftar utang pelanggan Anda. Jangan biarkan kas warung macet!
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-error-container/20 border border-error/20 p-space-md rounded-2xl flex flex-col min-w-[200px]">
            <span className="font-label-sm uppercase text-error font-bold mb-1">Belum Lunas</span>
            <span className="font-currency-display text-error font-extrabold text-2xl">
              Rp {totalPiutang.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-on-surface-variant mt-1">
              {debts.filter(d => d.status === 'UNPAID').length} tagihan aktif
            </span>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-space-md rounded-2xl flex flex-col min-w-[200px]">
            <span className="font-label-sm uppercase text-primary font-bold mb-1">Sudah Lunas</span>
            <span className="font-currency-display text-primary font-extrabold text-2xl">
              Rp {totalLunas.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-on-surface-variant mt-1">
              {debts.filter(d => d.status === 'PAID').length} riwayat selesai
            </span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:opacity-75 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-sm overflow-hidden">
        {/* Action Toolbar */}
        <div className="p-space-md border-b border-outline/20 flex flex-col md:flex-row justify-between items-center gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                placeholder="Cari pelanggan / no hp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex bg-surface-container-low p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'ALL' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'UNPAID' ? 'bg-surface-container-lowest shadow-sm text-error' : 'text-on-surface-variant'}`}
              >
                Belum Lunas
              </button>
              <button
                onClick={() => setFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === 'PAID' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}
              >
                Lunas
              </button>
            </div>
          </div>

          <button 
            onClick={() => { setIsModalOpen(true); setErrorMessage(''); }}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-on-primary px-space-md py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span> Tambah Catatan
          </button>
        </div>
        
        {/* Table Content */}
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
              {filteredDebts.length > 0 ? (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="p-space-md font-body-lg text-on-surface font-semibold">
                      {debt.customer_name}
                    </td>
                    <td className="p-space-md font-body-md text-on-surface-variant">
                      {debt.customer_phone || '-'}
                    </td>
                    <td className={`p-space-md font-body-lg font-bold ${debt.status === 'PAID' ? 'text-on-surface-variant line-through' : 'text-error'}`}>
                      Rp {debt.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-space-md font-body-md text-on-surface-variant">
                      {new Date(debt.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-space-md">
                      <button
                        onClick={() => handleToggleStatus(debt)}
                        title="Klik untuk ubah status"
                        className={`px-3 py-1 rounded-full font-label-sm font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                          debt.status === 'PAID' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-error-container text-on-error-container hover:brightness-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {debt.status === 'PAID' ? 'check_circle' : 'pending'}
                        </span>
                        {debt.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </button>
                    </td>
                    <td className="p-space-md text-right">
                      <div className="inline-flex items-center gap-1">
                        {debt.status === 'UNPAID' && (
                          <button 
                            onClick={() => {
                              const hariTelat = hitungHariTelat(debt.due_date);
                              const msg = buatPesanTagih({
                                nama: debt.customer_name,
                                nominal: debt.amount,
                                hariTelat: hariTelat,
                                toko: 'WarungCopilot'
                              });
                              setPreviewMessage(msg);
                              setPreviewDebt(debt);
                              setPreviewPhone(debt.customer_phone || '');
                            }}
                            title="Kirim pengingat WhatsApp"
                            className="text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1 font-label-md font-bold bg-primary/10 px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">send</span> Tagih WA
                          </button>
                        )}
                        <button
                          onClick={() => { setEditDebt(debt); setIsEditModalOpen(true); }}
                          title="Edit Catatan"
                          className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(debt)}
                          title={debt.status === 'UNPAID' ? 'Tandai Lunas' : 'Tandai Belum Lunas'}
                          className="p-1.5 text-on-surface-variant hover:text-emerald-600 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {debt.status === 'UNPAID' ? 'check' : 'undo'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(debt)}
                          title="Hapus Catatan"
                          className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-space-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-5xl opacity-40">receipt_long</span>
                      <p className="font-label-lg">
                        {search || filter !== 'ALL' ? 'Tidak ada data piutang yang cocok.' : 'Belum ada catatan piutang/kasbon.'}
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary hover:underline text-sm font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> Catat Kasbon Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview Tagihan WA */}
      {previewDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">forum</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Kirim Pesan Tagihan</h3>
              </div>
              <button 
                onClick={() => setPreviewDebt(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nomor Tujuan
                </label>
                <input
                  type="tel"
                  value={previewPhone}
                  onChange={(e) => setPreviewPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Pesan WhatsApp
                </label>
                <textarea
                  value={previewMessage}
                  onChange={(e) => setPreviewMessage(e.target.value)}
                  className="w-full h-48 px-4 py-3 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  onClick={() => setPreviewDebt(null)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                {previewPhone && normalisasiNomor(previewPhone) ? (
                  <a
                    href={linkWa(previewPhone, previewMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      updateLastBilled(previewDebt.id);
                      if (previewPhone !== previewDebt.customer_phone) {
                        updateDebtPhone(previewDebt.id, previewPhone);
                        setDebts(prev => prev.map(d => d.id === previewDebt.id ? { ...d, customer_phone: previewPhone } : d));
                      }
                      setPreviewDebt(null);
                      setSuccessMessage('Pesan WA telah disiapkan di tab baru.');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">send</span> Kirim via WhatsApp
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">block</span> Tambahkan nomor HP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Catatan Piutang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">post_add</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Catat Piutang / Kasbon Baru</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-error-container/40 border border-error/20 text-error rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Pelanggan <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  placeholder="Contoh: Bu Siti / Mas Joko"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nomor HP / WhatsApp (Untuk Notifikasi Tagihan)
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Jumlah Kasbon (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="500"
                    step="500"
                    placeholder="Contoh: 75000"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md font-bold text-error"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Jatuh Tempo <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    required
                    defaultValue={defaultDueDate}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Simpan Catatan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Catatan Piutang */}
      {isEditModalOpen && editDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-6 w-full max-w-lg shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-outline/10">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">edit</span>
                <h3 className="font-headline-sm font-bold text-on-surface">Edit Catatan Piutang / Kasbon</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-error-container/40 border border-error/20 text-error rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={editDebt.id} />
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nama Pelanggan <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  defaultValue={editDebt.customer_name}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Nomor HP / WhatsApp (Untuk Notifikasi Tagihan)
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  defaultValue={editDebt.customer_phone}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Jumlah Kasbon (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="500"
                    step="500"
                    defaultValue={editDebt.amount}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md font-bold text-error"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Jatuh Tempo <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    required
                    defaultValue={editDebt.due_date ? new Date(editDebt.due_date).toISOString().split('T')[0] : ''}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline/20 rounded-xl text-sm focus:outline-none focus:border-primary font-body-md"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline/20 text-on-surface-variant hover:bg-surface-container font-bold text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
