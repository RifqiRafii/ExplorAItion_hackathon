'use client';

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Kasir Utama &bull; Live Monitor</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
            Ringkasan Keuangan Hari Ini
          </h1>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pb-space-lg">
        {/* Metric 1 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-space-xs mb-4">
            <span className="material-symbols-outlined text-primary">payments</span>
            <span className="font-label-sm uppercase text-on-surface-variant font-bold">Kas Aktual Riil</span>
          </div>
          <div className="font-currency-display text-primary font-extrabold tracking-tight">
            Rp 14.850.000
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-space-xs mb-4">
            <span className="material-symbols-outlined text-tertiary">menu_book</span>
            <span className="font-label-sm uppercase text-tertiary font-bold">Piutang Aktif</span>
          </div>
          <div className="font-currency-display text-tertiary font-extrabold tracking-tight">
            Rp 4.320.000
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-space-xs mb-4">
            <span className="material-symbols-outlined text-error">inventory_2</span>
            <span className="font-label-sm uppercase text-error font-bold">Nilai Aset Stok</span>
          </div>
          <div className="font-currency-display text-on-surface font-extrabold tracking-tight">
            Rp 28.500.000
          </div>
        </div>
      </div>

      <div className="mb-space-lg">
        <h2 className="font-headline-sm font-bold mb-4">Tindakan AI (Contoh Dummy)</h2>
        <div className="p-space-md rounded-xl bg-surface-container-lowest border-l-4 border-error shadow-sm flex flex-col gap-2">
          <div className="font-label-md font-bold text-error">Peringatan Stok Genting</div>
          <p className="text-body-md">Minyak Kita 2L tersisa 3 Pouch di etalase. AI memprediksi habis sebelum jam 16:00 sore ini saat jam masak warga.</p>
        </div>
      </div>
    </div>
  );
}
