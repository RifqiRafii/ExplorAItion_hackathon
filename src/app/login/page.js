'use client';

import { login } from '@/app/actions/auth';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { Store, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [error, formAction] = useFormState(async (prevState, formData) => {
    const res = await login(formData);
    return res?.error || null;
  }, null);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="h-[80px] border-b border-outline/20 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Store className="w-8 h-8 text-primary group-hover:scale-105 transition-transform" />
          <span className="font-display font-bold text-2xl text-primary tracking-tight">WarungCopilot</span>
        </Link>
        <Link href="/register" className="text-sm font-bold text-primary hover:text-primary-container transition-colors">
          Daftar UMKM
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-surface to-surface-container-low">
        <div className="w-full max-w-[440px] bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline/20">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-on-surface mb-2 tracking-tight">Masuk ke Dasbor</h1>
            <p className="text-on-surface-variant text-[15px]">Lanjutkan pengelolaan warung pintar Anda</p>
          </div>

          <form action={formAction} className="space-y-5">
            {error && (
              <div className="p-4 bg-error-container/50 border border-error/20 text-on-error-container rounded-xl text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-on-surface uppercase tracking-wide">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full h-[52px] pl-12 pr-4 bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[15px] transition-all placeholder:text-outline-variant"
                  placeholder="budi@warung.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[13px] font-bold text-on-surface uppercase tracking-wide">Kata Sandi</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full h-[52px] pl-12 pr-4 bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[15px] transition-all placeholder:text-outline-variant"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full h-[52px] bg-primary hover:bg-[#154a40] text-white rounded-xl font-bold text-[15px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline/20 text-center">
            <p className="text-[15px] text-on-surface-variant">
              Belum mendaftarkan warung?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline transition-all">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
