import Link from 'next/link';
import { Faq } from './faq';
import { routes } from '@couture-next/routing';
import { generateMetadata } from '@couture-next/utils';

export const metadata = generateMetadata({
  title: 'Foire aux questions',
  alternates: { canonical: routes().faq().index() },
  description:
    'Vous avez des questions ? Retrouvez les réponses aux questions les plus fréquentes sur Petit Roudoudou.',
});

export default function Page() {
  return (
    <div className="max-3xl mx-auto px-4">
      <h1 className="font-serif text-center text-3xl mt-8">Foire aux questions</h1>
      <p className="text-center mt-4">
        Tu ne trouves pas la réponse à ta question ? RDV sur notre{' '}
        <Link className="underline" href={routes().contactUs()}>
          page de contact
        </Link>
      </p>
      <Faq />
    </div>
  );
}
