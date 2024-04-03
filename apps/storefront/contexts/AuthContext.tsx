'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  User,
  signInWithCredential,
  updateProfile,
  updateEmail,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import app from '../firebase';
import { UseMutationResult, UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import { isbot } from 'isbot';

if (process.env.NODE_ENV === 'development')
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });

type AuthContextValue = {
  userQuery: UseQueryResult<User | null>;
  isAdminQuery: UseQueryResult<boolean>;

  editProfileMutation: UseMutationResult<
    void,
    unknown,
    {
      displayName: string;
      email: string;
    }
  >;
  sendResetPasswordEmailMutation: UseMutationResult<void, unknown, { email: string }>;
  logoutMutation: UseMutationResult<void, unknown, void>;
  loginMutation: UseMutationResult<
    void,
    unknown,
    | {
        type: 'email-login';
        email: string;
        password: string;
      }
    | {
        type: 'email-register';
        email: string;
        password: string;
        firstName: string;
      }
    | { type: 'google' }
  >;

  errorFromCode: (code: string) => string;
};

const AuthContext = createContext<null | AuthContextValue>(null);

export function AuthProvider({ children }: PropsWithChildren<{ tokenCookie?: string }>) {
  const [auth] = useState(getAuth(app));
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: () =>
      new Promise((resolve, reject) =>
        auth
          .authStateReady()
          .then(() => {
            if (!auth.currentUser) return signInAnonymously(auth);
          })
          .then(() => resolve(auth.currentUser))
          .catch(reject)
      ),
    refetchOnWindowFocus: false,
    placeholderData: null,
    enabled: typeof navigator !== 'undefined' && !isbot(navigator.userAgent),
  }) satisfies AuthContextValue['userQuery'];

  const isAdminQuery = useQuery<boolean>({
    queryKey: ['user', 'isAdmin'],
    queryFn: async () => {
      if (!userQuery.data || !auth.currentUser || auth.currentUser.isAnonymous) return false;
      const idToken = await auth.currentUser.getIdTokenResult();
      return !!idToken.claims.admin;
    },
    refetchOnWindowFocus: false,
    enabled: !!userQuery.data && typeof navigator !== 'undefined' && !isbot(navigator.userAgent),
    placeholderData: false,
  });

  // Update userQuery when auth state changes
  useEffect(() => {
    if (isbot(navigator.userAgent)) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      queryClient.setQueryData(['user'], user);
      queryClient.invalidateQueries({
        queryKey: ['user', 'isAdmin'],
        exact: true,
      });
    });
    return unsubscribe;
  }, [auth, queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (auth.currentUser?.isAnonymous) return;
      await signInAnonymously(auth);
    },
  });

  const editProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; email: string }) => {
      if (!userQuery.data) return;
      if (data.email !== userQuery.data.email) {
        await updateEmail(userQuery.data, data.email);
      }
      if (data.displayName !== userQuery.data.displayName) {
        await updateProfile(userQuery.data, {
          displayName: data.displayName,
        });
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      if (auth.currentUser?.isAnonymous && data.type === 'email-register') {
        // is anonymous and wants to register with email
        const credential = EmailAuthProvider.credential(data.email, data.password);
        const userCred = await linkWithCredential(auth.currentUser, credential);
        await updateProfile(userCred.user, { displayName: data.firstName });
      } else if (auth.currentUser?.isAnonymous && data.type === 'google') {
        // is anonymous and wants to login/register with google
        const provider = new GoogleAuthProvider();
        try {
          await linkWithPopup(auth.currentUser, provider);
        } catch (e) {
          if (!(e instanceof FirebaseError) || e.code !== 'auth/credential-already-in-use') throw e;
          // credential is already in use, try to sign in to linked account instead
          const credential = GoogleAuthProvider.credentialFromError(e);
          if (credential === null) throw new Error('credential is null');
          await signInWithCredential(auth, credential);
        }
      } else if (data.type === 'email-login')
        // is not anonymous and wants to login
        await signInWithEmailAndPassword(auth, data.email, data.password);
      else if (data.type === 'email-register') {
        // is not anonymous and wants to register
        const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(userCred.user, { displayName: data.firstName });
      } else if (data.type === 'google') {
        // is not anonymous and wants to login with google
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    },
  }) satisfies AuthContextValue['loginMutation'];

  const sendResetPasswordEmailMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      await sendPasswordResetEmail(auth, email);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        sendResetPasswordEmailMutation,
        userQuery,
        isAdminQuery,
        logoutMutation,
        loginMutation,
        editProfileMutation,
        errorFromCode,
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

function errorFromCode(code: string) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cette adresse e-mail.';
    case 'auth/invalid-email':
      return "L'adresse e-mail est mal formatée.";
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/user-not-found':
      return "Aucun compte n'est associé à cette adresse e-mail.";
    case 'auth/wrong-password':
      return 'Le mot de passe est invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères';
    case 'auth/invalid-credential':
      return 'Ce compte utilise un autre mode de connexion.';
    default:
      return 'Une erreur est survenue.';
  }
}
