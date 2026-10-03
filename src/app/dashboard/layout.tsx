import { cookies } from 'next/headers';
import DashboardShell from '@/components/DashboardShell';
import type { UserSession } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userSessionStr = cookieStore.get('userSession')?.value;
  const user: UserSession | null = userSessionStr ? JSON.parse(userSessionStr) : null;

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
