'use client';

import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const trpcUtils = trpc.useUtils();
  const getMeQuery = trpc.auth.me.useQuery();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess() {
      trpcUtils.auth.me.invalidate();
    },
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess() {
      trpcUtils.auth.me.invalidate();
    },
  });

  return (
    <>
      <p>{JSON.stringify(getMeQuery.data, null, 2)}</p>
      <button
        type="button"
        onClick={() => {
          loginMutation.mutate({
            email: 'test@test.com',
            password: 'testtest',
          });
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          console.log('registerMutation', registerMutation);
          registerMutation.mutate({
            email: 'test@test.com',
            password: 'testtest',
            firstName: 'John',
            lastName: 'Doe',
          });
        }}
      >
        Register
      </button>
    </>
  );
}
