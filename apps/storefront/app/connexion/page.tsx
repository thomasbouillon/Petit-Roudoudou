import UserCredentialsForm from '../userAuthForm';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { signInWithEmail } from './utils';

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <UserCredentialsForm
        title="Connexion"
        submitLabel="Me connecter"
        submit={signInWithEmail}
      >
        <p className="mt-6">
          Pas encore de compte ?{' '}
          <Link
            href={routes().auth().register()}
            className="text-primary underline"
          >
            Créer mon compte
          </Link>
        </p>
      </UserCredentialsForm>
    </div>
  );
}
