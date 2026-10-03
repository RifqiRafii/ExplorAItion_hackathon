'use client';
import { logout } from '@/app/actions/auth';

export default function Header({ user }) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-gutter-desktop flex items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-md flex-1">
        <div className="flex items-center gap-space-xs text-on-surface">
          <span className="material-symbols-outlined text-primary text-xl">storefront</span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{user?.store_name || 'Warung Berkah Jaya'}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-space-xs pl-space-xs">
          <div className="hidden md:flex flex-col items-end mr-3">
            <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">{user?.owner_name || 'Pak Budi'}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Owner Warung</span>
          </div>
          <button 
            onClick={() => logout()} 
            className="px-3 py-1.5 bg-error-container text-on-error-container rounded-lg font-label-sm hover:bg-error hover:text-on-error transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
