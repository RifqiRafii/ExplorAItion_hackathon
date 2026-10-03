import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }) {
  const userSessionStr = cookies().get('userSession')?.value;
  const user = userSessionStr ? JSON.parse(userSessionStr) : null;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar user={user} />
      <div className="pl-72 flex flex-col flex-1 w-full relative">
        <Header user={user} />
        <main className="w-full pt-16 px-space-gutter-desktop py-space-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
