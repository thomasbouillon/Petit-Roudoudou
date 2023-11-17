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
} from 'firebase/auth';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import app from '../firebase';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

if (process.env.NODE_ENV === 'development')
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });

type AuthContextValue = {
  userQuery: UseQueryResult<User | null>;
  isAdminQuery: UseQueryResult<boolean>;

  logoutMutation: UseMutationResult<void, unknown, void>;
  loginMutation: UseMutationResult<
    void,
    unknown,
    | {
        type: 'email-login' | 'email-register';
        email: string;
        password: string;
      }
    | { type: 'google' }
  >;

  errorFromCode: (code: string) => string;
};

const AuthContext = createContext<null | AuthContextValue>(null);

export function AuthProvider({
  children,
}: PropsWithChildren<{ tokenCookie?: string }>) {
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
  }) satisfies AuthContextValue['userQuery'];

  const isAdminQuery = useQuery<boolean>({
    queryKey: ['user', 'isAdmin'],
    queryFn: async () => {
      if (!userQuery.data || !auth.currentUser || auth.currentUser.isAnonymous)
        return false;
      const idToken = await auth.currentUser.getIdTokenResult();
      return !!idToken.claims.admin;
    },
    refetchOnWindowFocus: false,
    enabled: !!userQuery.data,
    placeholderData: false,
  });

  // Update userQuery when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      queryClient.setQueryData(['user'], user);
      queryClient.invalidateQueries({
        queryKey: ['user', 'isAdmin'],
        exact: true,
      });
    });
    return unsubscribe;
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (auth.currentUser?.isAnonymous) return;
      await signInAnonymously(auth);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      if (auth.currentUser?.isAnonymous && data.type === 'email-register') {
        // is anonymous and wants to register
        const credential = EmailAuthProvider.credential(
          data.email,
          data.password
        );
        await linkWithCredential(auth.currentUser, credential);
      } else if (auth.currentUser?.isAnonymous && data.type === 'google') {
        // is anonymous and wants to login with google
        const provider = new GoogleAuthProvider();
        await linkWithPopup(auth.currentUser, provider);
      } else if (data.type === 'email-login')
        // is not anonymous and wants to login
        await signInWithEmailAndPassword(auth, data.email, data.password);
      else if (data.type === 'email-register')
        // is not anonymous and wants to register
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      else if (data.type === 'google') {
        // is not anonymous and wants to login with google
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    },
  }) satisfies AuthContextValue['loginMutation'];

  return (
    <AuthContext.Provider
      value={{
        userQuery,
        isAdminQuery,
        logoutMutation,
        loginMutation,
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
    default:
      return 'Une erreur est survenue.';
  }
}
