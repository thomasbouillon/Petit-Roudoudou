'use client';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import UserCredentialsForm from '../userAuthForm';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <UserCredentialsForm
        title="Inscription"
        submitLabel="Créer mon compte"
        submit={(auth, email, password) =>
          createUserWithEmailAndPassword(auth, email, password).then(
            (userCredential) => userCredential.user
          )
        }
      >
        <p className="mt-6">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-primary underline">
            Me connecter
          </Link>
        </p>
      </UserCredentialsForm>
    </div>
  );
}
