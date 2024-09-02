'use client';

import { routes } from '@couture-next/routing';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { trpc } from 'apps/storefront/trpc-client';

export default function AutoRedirect() {
  console.log('rendering');

  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const errorReason = searchParams.get('error_reason');
  const errorUri = searchParams.get('error_uri');
  const state = searchParams.get('state');

  const { userQuery } = useAuth();
  const router = useRouter();

  const trpcUtils = trpc.useUtils();
  const loginWithGoogleMutation = trpc.auth.googleOauth.login.useMutation({
    async onSuccess() {
      await trpcUtils.auth.me.invalidate();
      await trpcUtils.carts.invalidate();
    },
  });

  useEffect(() => {
    if (!code) return;
    const timeout = setTimeout(() => {
      loginWithGoogleMutation.mutateAsync(code).catch((err) => {
        console.error(err);
        toast.error("Une erreur s'est produite lors de la connexion avec Google");
        router.push(routes().index());
      });
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (userQuery.data && userQuery.data?.role !== 'ANONYMOUS') {
    router.push(routes().index());
  }

  if (!code && !userQuery.isPending) {
    throw new Error('No code');
  }

  if (error) {
    console.debug({ error, errorDescription, errorReason, errorUri, state });
    throw new Error('Google OAuth callback error');
  }

  return null;
}
