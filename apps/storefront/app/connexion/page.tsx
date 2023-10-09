'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import UserCredentialsForm from '../userAuthForm';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <UserCredentialsForm
        title="Connexion"
        submitLabel="Me connecter"
        submit={(auth, email, password) =>
          signInWithEmailAndPassword(auth, email, password).then(
            (userCredential) => userCredential.user
          )
        }
      >
        <p className="mt-6">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="text-primary underline">
            Créer mon compte
          </Link>
        </p>
      </UserCredentialsForm>
    </div>
  );
}
