import { Suspense } from 'react';
import { generateMetadata } from '@couture-next/utils';
import CreateAccountForm from './form';

export const metadata = generateMetadata({
  title: 'Inscription',
  description: 'Rejoignez la communauté des Petits roudoudous en créant votre compte dès maintenant !',
});

export default function Page() {
  return (
    <div className="max-w-md mx-auto">
      <Suspense fallback="Chargement du formulaire d'inscription">
        <CreateAccountForm />
      </Suspense>
    </div>
  );
}
