'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import type { UserSession } from '@/types';

interface DashboardShellProps {
  user: UserSession | null;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Main content shifts right only on desktop */}
      <div className="flex flex-col flex-1 w-full min-w-0 lg:pl-72">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="w-full pt-16 px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
