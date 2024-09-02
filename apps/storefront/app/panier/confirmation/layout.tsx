import AuthGuard from '../../../guards/AuthGuard';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return children;
  return <AuthGuard>{children}</AuthGuard>;
}
