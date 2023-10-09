import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { useMemo, useState } from 'react';
import app from '../firebase';

if (process.env.NODE_ENV === 'development')
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099');

export default function useAuth() {
  const auth = useMemo(() => {
    const auth = getAuth(app);
    return auth;
  }, []);

  const [user, setUser] = useState(() => auth.currentUser);

  return { auth, user, setUser, errorFromCode };
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
