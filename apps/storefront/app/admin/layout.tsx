import { Metadata } from 'next';
import AuthGuard from '../../guards/AuthGuard';
import { PropsWithChildren } from 'react';
import AdminNotifications from './adminNotifications';
import { ErrorBoundary } from 'react-error-boundary';

export const metadata: Metadata = {
  robots: 'noindex,nofollow',
};

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AuthGuard adminOnly>
      <ErrorBoundary fallback={<></>}>
        <AdminNotifications />
      </ErrorBoundary>
      <div className="px-4 min-h-[min(35rem,100vh)] mt-8 md:mt-24">{children}</div>
    </AuthGuard>
  );
}
