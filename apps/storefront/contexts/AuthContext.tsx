'use client';

import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { trpc } from '../trpc-client';
import { UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { TRPCRouterOutput } from '@couture-next/api-connector';
import env from '../env';

type AuthContextValue = {
  userQuery: UseTRPCQueryResult<TRPCRouterOutput['auth']['me'], unknown>;
  isAdmin: boolean;
  // editProfileMutation: UseMutationResult<
  //   void,
  //   unknown,
  //   {
  //     displayName: string;
  //     email: string;
  //   }
  // >;
  // sendResetPasswordEmailMutation: UseMutationResult<void, unknown, { email: string }>;
  logoutMutation: UseMutationResult<void, unknown, void>;
  loginWithEmailPassMutation: ReturnType<typeof trpc.auth.login.useMutation>;
  registerWithEmailPassMutation: ReturnType<typeof trpc.auth.register.useMutation>;
};

const AuthContext = createContext<null | AuthContextValue>(null);

export function AuthProvider({ children }: PropsWithChildren<{ tokenCookie?: string }>) {
  const trpcUtils = trpc.useUtils();

  const userQuery = trpc.auth.me.useQuery(undefined, {
    refetchOnWindowFocus: false,
    placeholderData: null,
  });

  const isAdmin = useMemo(() => userQuery.data?.role === 'ADMIN', [userQuery.data]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      document.cookie =
        'auth-client-key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + env.COOKIE_DOMAIN + '';
      trpcUtils.auth.me.invalidate();
      trpcUtils.carts.invalidate();
    },
  });

  // const editProfileMutation = useMutation({
  //   mutationFn: async (data: { displayName: string; email: string }) => {
  //     if (!userQuery.data) return;
  //     if (data.email !== userQuery.data.email) {
  //       await updateEmail(userQuery.data, data.email);
  //     }
  //     if (data.displayName !== userQuery.data.displayName) {
  //       await updateProfile(userQuery.data, {
  //         displayName: data.displayName,
  //       });
  //     }
  //   },
  // });

  const loginWithEmailPassMutation = trpc.auth.login.useMutation({
    onSuccess() {
      trpcUtils.auth.me.invalidate();
      trpcUtils.carts.findMyCart.invalidate();
    },
  });
  const registerWithEmailPassMutation = trpc.auth.register.useMutation({
    onSuccess() {
      trpcUtils.auth.me.invalidate();
      trpcUtils.carts.findMyCart.invalidate();
    },
  });

  // const sendResetPasswordEmailMutation = useMutation({
  //   mutationFn: async ({ email }: { email: string }) => {
  //     await sendPasswordResetEmail(auth, email);
  //   },
  // });

  return (
    <AuthContext.Provider
      value={{
        userQuery,
        isAdmin,
        logoutMutation,
        loginWithEmailPassMutation,
        registerWithEmailPassMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
