import Link from 'next/link';
import { ArrowRight, FileText, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-500 h-[80px] bg-surface/80 backdrop-blur-md border-b border-outline/20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 duration-200">
            <span className="material-symbols-outlined text-4xl text-primary drop-shadow-sm">storefront</span>
            <span className="font-display font-bold text-[28px] text-primary tracking-tight">WarungCopilot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="relative text-primary text-[15px] font-bold group">
              Beranda
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary rounded-full transition-transform origin-left scale-x-100"></span>
            </Link>
            <Link href="#fitur" className="relative text-on-surface-variant hover:text-primary text-[15px] font-medium transition-colors group">
              Fitur AI
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary rounded-full transition-transform origin-left scale-x-0 group-hover:scale-x-100 duration-300"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex h-10 bg-primary text-white text-sm font-bold rounded-full px-6 hover:bg-primary-container transition-all duration-200 items-center justify-center shadow-lg hover:-translate-y-0.5">
              Masuk
            </Link>
            <Link href="/register" className="hidden md:inline-flex h-10 border border-primary text-primary text-sm font-bold rounded-full px-6 hover:bg-primary/5 transition-all duration-200 items-center justify-center">
              Daftar UMKM
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[80px]">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-[#0f3d35] z-[1]"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-12 py-12">
            <div className="max-w-xl w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-[12px] font-bold uppercase tracking-widest shadow-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                AI Assistant untuk Warung
              </div>
              <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-[72px] leading-[1.1] tracking-[-2px] text-white mb-6 drop-shadow-lg">
                Kelola Warung <br/>
                <span className="text-secondary">Tanpa Kalkulator.</span>
              </h1>
              <p className="text-[16px] sm:text-lg font-normal text-white/90 leading-relaxed mb-10 drop-shadow-sm max-w-lg">
                Asisten Keuangan & Inventaris AI khusus Pemilik Warung dan UMKM Sembako. Catat piutang, pantau stok, dan hitung laba secara otomatis menggunakan suara atau foto nota.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/register" className="group relative w-full sm:w-auto h-14 bg-white text-primary text-[15px] font-bold px-9 rounded-full flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1">
                  <span className="relative z-10">Mulai Gratis Sekarang</span>
                  <ArrowRight className="w-[18px] h-[18px] relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-surface-container-low to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link href="/login" className="group w-full sm:w-auto h-14 border border-white/30 bg-white/5 backdrop-blur-md hover:bg-white/15 text-white text-[15px] font-semibold px-9 rounded-full flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-1">
                  <FileText className="w-[18px] h-[18px] text-white/70 group-hover:text-white transition-colors duration-300" />
                  <span>Coba Demo AI</span>
                </Link>
              </div>
            </div>

            {/* Dashboard Mockup Display */}
            <div className="w-full max-w-2xl hidden md:block">
              <div className="bg-surface rounded-2xl p-2 shadow-2xl border border-white/20 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline/20">
                  <div className="h-8 bg-surface-container-high border-b border-outline/20 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-4">
                        <div className="w-32 h-24 bg-surface rounded-lg shadow-sm border border-outline/10 p-3">
                          <div className="text-[10px] text-on-surface-variant uppercase font-bold">Kas Riil</div>
                          <div className="text-lg font-bold text-primary mt-1">Rp 14.850K</div>
                        </div>
                        <div className="w-32 h-24 bg-surface rounded-lg shadow-sm border border-outline/10 p-3">
                          <div className="text-[10px] text-on-surface-variant uppercase font-bold">Piutang Aktif</div>
                          <div className="text-lg font-bold text-on-secondary-container mt-1">Rp 4.320K</div>
                        </div>
                      </div>
                    </div>
                    {/* Mockup Chat */}
                    <div className="bg-surface rounded-lg border border-outline/20 p-4">
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"><Zap size={16}/></div>
                        <div className="bg-surface-container-low p-3 rounded-lg rounded-tl-none text-sm w-[80%]">
                          Minyak Kita 2L tersisa 3 Pouch. Prediksi habis sore ini. Rekomendasi: Kulakan 2 Karton ke Grosir Berkah.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section id="fitur" className="py-20 md:py-24 bg-surface border-b border-outline/20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-on-surface">Meninggalkan Cara Lama</h2>
              <p className="text-on-surface-variant mt-4 max-w-xl mx-auto">Transformasi pencatatan warung dari buku tulis basah ke dashboard cerdas AI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-outline/30 shadow-xl relative">
              <div className="bg-error-container/30 p-8 md:p-12 flex flex-col justify-start">
                <h3 className="text-sm uppercase tracking-wider font-bold text-error mb-8">Tanpa WarungCopilot</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 text-sm text-on-surface-variant">
                    <div className="bg-error/10 p-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-error"></div></div>
                    <span>Catat piutang di buku tulis yang sering hilang atau tersiram air.</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-on-surface-variant">
                    <div className="bg-error/10 p-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-error"></div></div>
                    <span>Tidak tahu pasti laba bersih harian (Ilusi Laba Omzet).</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-on-surface-variant">
                    <div className="bg-error/10 p-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-error"></div></div>
                    <span>Sering kehabisan stok barang laris saat pembeli ramai.</span>
                  </li>
                </ul>
              </div>

              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-outline/20 z-10"></div>

              <div className="bg-primary-container/10 p-8 md:p-12 flex flex-col justify-start border-t md:border-t-0 border-outline/30">
                <h3 className="text-sm uppercase tracking-wider font-bold text-primary mb-8">Dengan WarungCopilot AI</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 text-sm text-on-surface font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Rekap piutang otomatis dan draf WA tagihan santun 1-klik.</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-on-surface font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Analisis laba bersih riil dan pemisahan kas secara instan.</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-on-surface font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>AI Prediksi Stok Habis (Peringatan cerdas untuk kulakan).</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-on-surface font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Dikte Suara AI: "Beras dua sak lima puluh ribu" langsung tercatat!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container-low py-12 border-t border-outline/20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">storefront</span>
              <span className="font-bold text-primary text-lg">WarungCopilot</span>
            </div>
            <p className="text-sm text-on-surface-variant">© 2026 Hak Cipta Dilindungi. Solusi UMKM Indonesia.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
