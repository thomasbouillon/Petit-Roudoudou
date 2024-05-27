import { Suspense } from 'react';
import { generateMetadata } from '@couture-next/utils';
import CreateAccountForm from './form';
import { routes } from '@couture-next/routing';

export const metadata = generateMetadata({
  title: 'Inscription',
  alternates: { canonical: routes().auth().register() },
  description:
    "Rejoignez la communauté des Petits Roudoudous en créant votre compte dès maintenant ! Profitez de notre personnalisation et d'offres exclusives.",
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
