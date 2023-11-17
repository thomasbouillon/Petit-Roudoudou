import UserCredentialsForm from '../userAuthForm';
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
        action="login"
      />
    </div>
  );
}
