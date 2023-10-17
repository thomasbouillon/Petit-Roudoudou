'use client';

import { Auth, User, UserInfo } from 'firebase/auth';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import app from '../firebase';

if (process.env.NODE_ENV === 'development')
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099');

const AuthContext = createContext<null | {
  user: UserInfo | null;
  auth: Auth;
  errorFromCode: (code: string) => string;
  isAdmin: boolean;
  fetchingUser: boolean;
  fetchingIsAdmin: boolean;
}>(null);

export function AuthProvider({
  children,
}: PropsWithChildren<{ tokenCookie?: string }>) {
  const auth = useMemo(() => {
    const auth = getAuth(app);
    return auth;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [fetchingIsAdmin, setFetchingIsAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setFetchingUser(true);
    auth.authStateReady().then(() => {
      setFetchingUser(false);
    });
  }, [auth]);

  useEffect(
    () =>
      auth.onAuthStateChanged((user) => {
        setUser(user);
        if (!user) {
          setIsAdmin(false);
          setFetchingIsAdmin(false);
        } else {
          setFetchingIsAdmin(true);
          user.getIdTokenResult(true).then((idTokenResult) => {
            setIsAdmin(!!idTokenResult.claims.admin);
            setFetchingIsAdmin(false);
          });
        }
      }),
    [auth, setUser, setIsAdmin, setFetchingIsAdmin]
  );

  return (
    <AuthContext.Provider
      value={{
        auth,
        user,
        errorFromCode,
        isAdmin,
        fetchingUser,
        fetchingIsAdmin,
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
    default:
      return 'Une erreur est survenue.';
  }
}
