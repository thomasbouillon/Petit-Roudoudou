import { CustomizeGiftCardForm } from './CustomizeGiftCardForm';
import { generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';

export const metadata = generateMetadata({
  title: 'Carte cadeau',
  alternates: { canonical: routes().shop().createGiftCard() },
  description:
    'Créez des cartes cadeaux personnalisées pour vos proches ou vos collègues. Offrez un cadeau unique et spécial qui vous ressmemble. ',
});

export default function Page() {
  return (
    <div className="max-w-prose mx-auto px-4">
      <h1 className="text-3xl font-serif text-center my-8">Je personnalise ma carte cadeau</h1>
      <CustomizeGiftCardForm />
    </div>
  );
}
