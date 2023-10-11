'use client';
import AuthGuard from '../../guards/AuthGuard';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AuthGuard adminOnly>
      <div className="px-4 min-h-[min(35rem,100vh)] mt-8 md:mt-24">
        {children}
      </div>
    </AuthGuard>
  );
}
