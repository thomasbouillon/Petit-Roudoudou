import { Suspense } from 'react';
import LoginForm from './form';
import { generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';

export const metadata = generateMetadata({
  title: 'Connexion',
  alternates: { canonical: routes().auth().login() },
  description:
    'Connectez-vous à votre compte Petit roudoudou pour accéder à vos commandes et vos informations personnelles.',
});

export default async function Page() {
  return (
    <div className="max-w-md mx-auto">
      <Suspense fallback="Chargement du formulaire de connexion">
        <LoginForm />
      </Suspense>
    </div>
  );
}
