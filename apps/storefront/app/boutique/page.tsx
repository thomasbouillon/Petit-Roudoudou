import { generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { StorageImage } from '../StorageImage';
import Link from 'next/link';
import { Article } from '@couture-next/types';
import Filters from './s/[[...articlePath]]/Filters';
import Results from './s/[[...articlePath]]/Results';

export const metadata = generateMetadata({
  title: 'Boutique',
  alternates: { canonical: routes().shop().index() },
  description:
    'Venez découvrir tous les créations made in France 100% personnalisables ! Couvertures, Gigoteuses, Doudous, Bavoirs, tout est cousu à la main avec passion !',
});

export default async function Page() {
  const articles = await trpc.articles.list.query();

  return (
    <>
      <div className="flex flex-col-reverse">
        <h1 className="font-serif text-3xl text-center mb-6 mt-8">Toutes les créations</h1>
        <div className="mt-8 space-y-8">
          <div className="relative flex justify-center items-center bg-light-100 border-b border-light-200 py-2">
            <StorageImage
              alt="Un exemple de carte cadeau petit roudoudou"
              src="public/images/gift-card1.png"
              className="mx-2 border border-black rounded-lg"
              width={200}
              height={85}
            />
            <span className="text-xs sm:text-sm px-2  leading-5 aria-hidden:">
              <p>Découvrez nos cartes cadeaux virtuelles </p>
              <p>pour offrir à vos proches ou collègues !</p>
              <p className="underline font-semibold text-center mt-2">Découvrir</p>
            </span>
            <StorageImage
              alt="Un exemple de carte cadeau petit roudoudou"
              src="public/images/gift-card2.png"
              className="mx-2 border border-black rounded-lg"
              width={200}
              height={85}
            />
            <Link className="absolute top-0 left-0 right-0 bottom-0 " href={routes().shop().createGiftCard()}>
              <span className="sr-only">Création de carte cadeau</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <Filters />
      </div>
      <div className="space-y-8 lg:max-w-[72rem] mx-auto">
        <Results articles={articles as Article[]} useCarousels />
      </div>
    </>
  );
}
