import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';

export const metadata: Metadata = {
  title: {
    default: 'Crazy Capital Admin & Operations Workbench',
    template: '%s | CC Admin',
  },
  description: 'Crazy Capital internal administration & operations portal.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
