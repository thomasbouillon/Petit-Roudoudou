import { Metadata } from 'next';
import AuthGuard from '../../guards/AuthGuard';
import { PropsWithChildren } from 'react';
import AdminNotifications from './adminNotifications';

export const metadata: Metadata = {
  robots: 'noindex,nofollow',
};

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AuthGuard adminOnly>
      <AdminNotifications />
      <div className="px-4 min-h-[min(35rem,100vh)] mt-8 md:mt-24">{children}</div>
    </AuthGuard>
  );
}
