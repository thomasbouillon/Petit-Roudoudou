import UserCredentialsForm from '../userAuthForm';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { signInWithEmail } from './utils';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Connexion',
  description:
    'Connectez-vous à votre compte Petit roudoudou pour accéder à vos commandes et vos informations personnelles.',
});

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
