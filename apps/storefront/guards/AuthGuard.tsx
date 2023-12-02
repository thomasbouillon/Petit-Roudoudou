'use client';

import { PropsWithChildren } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { redirect } from 'next/navigation';
import { Spinner } from '@couture-next/ui';
import { routes } from '@couture-next/routing';

export default function AuthGuard({
  adminOnly,
  allowAnonymous,
  children,
}: PropsWithChildren<
  | {
      adminOnly?: true;
      allowAnonymous?: never;
    }
  | {
      adminOnly?: never;
      allowAnonymous?: false;
    }
>) {
  const { userQuery, isAdminQuery } = useAuth();

  console.log('Rendering AuthGuard');

  // Pending state
  if (userQuery.isPending || (adminOnly && isAdminQuery.isFetching))
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Spinner className="w-8 h-8" />
      </div>
    );

  // No user or is anonymous but it is not allowed
  if (
    !userQuery.data ||
    (userQuery.data.isAnonymous && allowAnonymous === false)
  )
    return redirect(routes().auth().login());

  // Admin only and not admin
  if (adminOnly && !isAdminQuery.data) return redirect(routes().index());

  // Good
  return <>{children}</>;
}
