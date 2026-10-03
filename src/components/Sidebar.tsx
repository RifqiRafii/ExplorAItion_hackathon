'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserSession } from '@/types';

interface SidebarProps {
  user: UserSession | null;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const links: NavLinkItem[] = [
    { href: '/dashboard', label: 'Beranda & Arus Kas', icon: 'dashboard' },
    { href: '/dashboard/laporan', label: 'Buku Besar & Laporan', icon: 'receipt_long' },
    { href: '/dashboard/chat', label: 'Copilot AI Chat', icon: 'smart_toy', badge: 'Online' },
    { href: '/dashboard/piutang', label: 'Buku Piutang & Kasbon', icon: 'menu_book' },
    { href: '/dashboard/stok', label: 'Stok & Restock', icon: 'inventory_2' },
    { href: '/dashboard/scan', label: 'Scanner AI (Foto)', icon: 'document_scanner', badge: 'New' }
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
      <div className="flex flex-col flex-1">
        {/* App Brand & Logo */}
        <div className="h-[80px] px-space-md flex items-center gap-3 bg-surface-container-low/40">
          <img src="/assets/maskotlogo.png" alt="Logo" className="w-[60px] h-[60px] object-contain drop-shadow-sm" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary leading-tight font-bold tracking-tight">WarungCopilot</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">AI Sembako &amp; Retail</span>
          </div>
        </div>

        {/* Store Profile Selector */}
        <div className="px-space-md py-space-sm">
          <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-lg">store</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-bold truncate max-w-[150px]">
                  {user?.store_name || user?.warung_name || 'Warung Berkah'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[150px]">Cabang Utama</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-space-md py-space-sm space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-space-md py-space-sm rounded-xl font-label-lg text-label-lg transition-all ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="flex items-center gap-1 bg-secondary-container/50 px-2 py-0.5 rounded-full font-label-sm text-label-sm text-on-secondary-container">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>{link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
