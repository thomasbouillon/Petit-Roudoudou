import { Suspense } from 'react';
import UserCredentialsForm from '../userAuthForm';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Inscription',
  description: 'Rejoignez la communauté des Petits roudoudous en créant votre compte dès maintenant !',
});

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <Suspense fallback="Chargement du formulaire d'inscription">
        <UserCredentialsForm title="Inscription" submitLabel="Créer mon compte" action="register" />
      </Suspense>
    </div>
  );
}
