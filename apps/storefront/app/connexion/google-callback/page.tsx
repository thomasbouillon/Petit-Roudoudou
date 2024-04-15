'use client';

import { trpc } from 'apps/storefront/trpc-client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const errorReason = searchParams.get('error_reason');
  const errorUri = searchParams.get('error_uri');
  const state = searchParams.get('state');
  console.log(code, error, errorDescription, errorReason, errorUri, state);
  if (!code) {
    throw new Error('No code');
  }

  const trpcUtils = trpc.useUtils();
  const loginWithGoogleMutation = trpc.auth.googleOauth.login.useMutation({
    onSuccess() {
      trpcUtils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    loginWithGoogleMutation.mutate(code);
  }, [code]);

  return <div>Google callback</div>;
}
