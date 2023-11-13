import UserCredentialsForm from '../userAuthForm';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { signUpWithEmail } from './utils';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Inscription',
  description:
    'Rejoignez la communauté des Petits roudoudous en créant votre compte dès maintenant !',
});

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <UserCredentialsForm
        title="Inscription"
        submitLabel="Créer mon compte"
        submit={signUpWithEmail}
      >
        <p className="mt-6">
          Déjà un compte ?{' '}
          <Link
            href={routes().auth().login()}
            className="text-primary underline"
          >
            Me connecter
          </Link>
        </p>
      </UserCredentialsForm>
    </div>
  );
}
