import { applyTaxes, generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import { ArrowTopRightOnSquareIcon, StarIcon } from '@heroicons/react/24/solid';
import Card from './card';
import { Carousel } from '@couture-next/ui';
import { ArticlesNavigationPopover } from './ArticlesNavigationPopover';
import { StorageImage } from '../StorageImage';
import Link from 'next/link';
import { Article } from '@couture-next/types';
import { WrenchIcon } from '@heroicons/react/24/outline';

export const metadata = generateMetadata({
  title: 'Boutique',
  alternates: { canonical: routes().shop().index() },
  description:
    'Venez découvrir tous les créations made in France 100% personnalisables ! Couvertures, Gigoteuses, Doudous, Bavoirs, tout est cousu à la main avec passion !',
});

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: Props) {
  const customizableOnly = 'customizableOnly' in searchParams && searchParams.customizableOnly === 'true';

  const articles = await trpc.articles.list.query();

  return (
    <>
      <div className="flex flex-col-reverse">
        <h1 className="font-serif text-3xl text-center mb-6 mt-8">Toutes les création</h1>
        {!customizableOnly && (
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
        )}
      </div>
      <div className="mb-6">
        <ArticlesNavigationPopover articles={articles as Article[]} />
      </div>
      <div className="space-y-8">
        {articles.map((article) => (
          <div>
            <Carousel.Container as="div">
              <div className="flex items-center mb-4 gap-4 px-4">
                <h2 className="text-2xl font-serif">{article.namePlural}</h2>
                <Link href={routes().shop().article(article.slug).index()}>
                  <span className="sr-only">Voir tout</span>
                  <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5" />
                </Link>
                {article.aggregatedRating !== null && (
                  <p className="flex items-center gap-1 text-sm top-1 relative">
                    <span className="sr-only">Score des clients: </span>
                    {article.aggregatedRating.toFixed(1)}/5
                    <StarIcon className="w-4 h-4 text-primary-100" />
                  </p>
                )}
                <Carousel.Controls className="ml-auto" />
              </div>
              <Carousel.Items className="pb-8 sm:px-4 px-2">
                <Carousel.Item>
                  <Card
                    title={article.name}
                    // description={article.shortDescription}
                    image={article.images[0].url}
                    placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
                    price={applyTaxes(article.skus[0].price)}
                    buttonLabelSrOnly="Je choisis mes tissus"
                    buttonLink={routes().shop().customize(article.slug)}
                    variant="customizable-article"
                  />
                </Carousel.Item>
                {article.stocks.map((stock) => (
                  <Carousel.Item key={stock.uid}>
                    <Card
                      title={stock.title}
                      // description={stock.shortDescription || stock.description}
                      image={stock.images[0].url}
                      placeholderDataUrl={stock.images[0].placeholderDataUrl ?? undefined}
                      price={applyTaxes(article.skus.find((sku) => sku.uid === stock.sku)?.price ?? 0)}
                      buttonLabelSrOnly="Découvrir"
                      buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
                      variant="default"
                      stock={stock.stock}
                    />
                  </Carousel.Item>
                ))}
                {!article.stocks.length && (
                  <Carousel.Item className="flex items-center">
                    <div className="bg-white p-4 rounded shadow-md">
                      <h2 className="text-primary font-serif text-primary-100 text-2xl text-center">Info</h2>
                      <p>
                        Il n'existe pas de modèles en stock pour cette création. Pas de panique, choisis tes tissus et
                        crée ta propre version !
                      </p>
                    </div>
                  </Carousel.Item>
                )}
              </Carousel.Items>
            </Carousel.Container>
          </div>
        ))}
      </div>
    </>
  );
}
