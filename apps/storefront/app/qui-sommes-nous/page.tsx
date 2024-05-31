import Link from 'next/link';
import { AboutUs } from './aboutUs';
import { routes } from '@couture-next/routing';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Qui sommes-nous ?',
  alternates: { canonical: routes().aboutUs().index() },
  description:
    'Vous avez des questions à propos de nous ? Retrouvez les réponses aux questions les plus fréquentes sur Petit Roudoudou.',
});

export default function Page() {
  return (
    <div className="max-3xl mx-auto px-4">
      <h1 className="font-serif text-center text-3xl mt-8">Qui sommes-nous ?</h1>
      <p className="text-center mt-4">
        Si tu as besoin d'aide ou que tu ne trouves pas de réponse à ta question ? RDV sur notre{' '}
        <Link className="underline" href={routes().contactUs()}>
          page de contact
        </Link>
      </p>
      <AboutUs />
    </div>
  );
}
