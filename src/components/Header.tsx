'use client';

import { logout } from '@/app/actions/auth';
import type { UserSession } from '@/types';

interface HeaderProps {
  user: UserSession | null;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-72 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Hamburger (mobile) + store name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          aria-label="Buka menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/assets/maskotlogo.png"
            alt="Logo"
            className="w-10 h-10 sm:w-[60px] sm:h-[60px] object-contain drop-shadow-sm shrink-0"
          />
          <span className="font-headline-sm text-base sm:text-headline-sm font-bold text-on-surface truncate">
            {user?.store_name || user?.warung_name || 'Warung Berkah Jaya'}
          </span>
        </div>
      </div>

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex flex-col items-end">
          <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">
            {user?.owner_name || 'Juragan'}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Owner Warung</span>
        </div>
        <button
          onClick={() => logout()}
          className="px-3 py-1.5 bg-error-container text-on-error-container rounded-lg font-label-sm text-sm hover:bg-error hover:text-on-error transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
