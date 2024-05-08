import { applyTaxes } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { ArrowTopRightOnSquareIcon, StarIcon } from '@heroicons/react/24/solid';
import Card from './boutique/card';
import { Carousel } from '@couture-next/ui';
import Link from 'next/link';
import { Article } from '@couture-next/types';

export async function ArticleCarousel({ article }: { article: Article }) {
  return (
    <div>
      <Carousel.Container as="div">
        <div className="flex items-center mb-4 gap-4 px-4">
          <h2 className="text-2xl font-serif">{article.namePlural}</h2>
          <Link href={routes().shop().article(article.slug).index()}>
            <span className="sr-only">Voir dans la boutique</span>
            <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5" />
          </Link>
          {article.aggregatedRating !== null && (
            <p className="flex items-center gap-1 text-sm top-1 relative">
              <span className="sr-only">Score des clients: </span>
              {article.aggregatedRating.toFixed(1)}/5
              <StarIcon className="w-4 h-4 text-primary-100" />
            </p>
          )}
          <Carousel.Controls className="ml-auto bg-white" />
        </div>
        <Carousel.Items className="pb-8 sm:px-4 px-2 overflow-y-visible">
          <Carousel.Item>
            <Card
              title={article.name}
              image={article.images[0].url}
              placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
              price={applyTaxes(article.skus[0].price)}
              buttonLabelSrOnly="Je choisis mes tissus"
              buttonLink={routes().shop().customize(article.slug)}
              variant="customizable-article-with-button"
            />
          </Carousel.Item>
          {article.stocks.map((stock) => (
            <Carousel.Item key={stock.uid}>
              <Card
                title={stock.title}
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
                  Il n'existe pas de modèles en stock pour cette création. Pas de panique, choisis tes tissus et crée ta
                  propre version !
                </p>
              </div>
            </Carousel.Item>
          )}
        </Carousel.Items>
      </Carousel.Container>
      <Link
        href={routes().shop().article(article.slug).index()}
        aria-hidden
        className="underline justify-end gap-2 -translate-y-4 px-4 hidden sm:flex"
      >
        <span>Voir dans la boutique</span>
        <ArrowTopRightOnSquareIcon className="w-6 h-6" />
      </Link>
    </div>
  );
}
