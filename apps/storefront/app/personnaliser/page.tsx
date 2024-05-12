import { trpc } from 'apps/storefront/trpc-server';
import Card from '../boutique/card';
import { routes } from '@couture-next/routing';
import { applyTaxes } from '@couture-next/utils';
import { Article } from '@couture-next/types';

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));

export default async function Page() {
  const articles = await trpc.articles.list.query();
  return (
    <div className="my-16">
      <h1 className="text-3xl font-serif text-center mb-8">Personnalisez votre article</h1>
      <div className="grid px-4 grid-cols-2 sm:grid-cols-[repeat(auto-fill,min(15rem,100%))] gap-2 sm:gap-8 sm:max-w-[68rem] place-content-center mx-auto">
        {articles.map((article, i) => (
          <Card
            title={article.name}
            titleAs="h2"
            description={article.shortDescription}
            image={article.images[0].url}
            placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
            price={applyTaxes(getMinimumPriceFromSkus((article as Article).skus))}
            key={article.id}
            buttonLabelSrOnly="Je choisis mes tissus"
            buttonLink={routes().shop().customize(article.slug)}
            variant="customizable-article-light"
            rating={article.aggregatedRating ?? undefined}
            imageIsPriority={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
