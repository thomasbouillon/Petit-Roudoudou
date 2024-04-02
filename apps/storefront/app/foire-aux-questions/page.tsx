import Link from 'next/link';
import { Faq } from './faq';
import { routes } from '@couture-next/routing';

export default function Page() {
  return (
    <div className="max-3xl mx-auto px-4">
      <h1 className="font-serif text-center text-3xl mt-8">Foire aux questions</h1>
      <p className="text-center mt-4">
        Vous ne trouvez pas la réponse à votre question ? Rendez-vous sur notre{' '}
        <Link className="underline" href={routes().contactUs()}>
          page de contact
        </Link>
      </p>
      <Faq />
    </div>
  );
}
