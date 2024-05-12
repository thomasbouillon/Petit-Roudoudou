import { generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { ArticlesNavigationPopover } from './ArticlesNavigationPopover';
import { StorageImage } from '../StorageImage';
import Link from 'next/link';
import { Article } from '@couture-next/types';
import { ArticleCarousel } from '../articleCarousel';

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
        <h1 className="font-serif text-3xl text-center mb-6 mt-8">Toutes les création</h1>
        <div className="px-4 mt-8 space-y-8">
          <Link
            className="border rounded-md border-primary-100 p-8 grid md:grid-cols-2 max-w-5xl mx-auto space-y-4"
            href={routes().shop().createGiftCard()}
          >
            <StorageImage
              alt="Un exemple de carte cadeau petit roudoudou"
              src="public/images/gift-card.png"
              className="mx-auto"
              width={350}
              height={165}
            />
            <span>
              Découvre les cartes cadeaux virtuelles Petit Roudoudou pour partager le fait main Français 🇫🇷
              <ul className="list-disc list-inside my-2">
                <li>Personnalise le montant</li>
                <li>Le design de la carte</li>
              </ul>
              Et offre-la à ta famille, tes amis ou collègues !
              <span className="btn-secondary mt-4 mx-auto md:ml-0">Découvrir</span>
            </span>
          </Link>
        </div>
      </div>
      <div className="mb-6">
        <ArticlesNavigationPopover articles={articles as Article[]} />
      </div>
      <div className="space-y-8 lg:max-w-[72rem] mx-auto">
        {articles.map((article) => (
          <ArticleCarousel article={article as Article} key={article.id} />
        ))}
      </div>
    </>
  );
}
