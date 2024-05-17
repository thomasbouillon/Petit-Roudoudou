import { Article } from '@couture-next/types';
import Card from '../../card';
import { applyTaxes } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { Fragment } from 'react';
import { ArticleCarousel } from 'apps/storefront/app/articleCarousel';

type Props = {
  articles: Article[];
  useCarousels?: boolean;
};

export default function Results({ articles, useCarousels }: Props) {
  if (useCarousels) {
    return articles.map((article) => <ArticleCarousel key={article.id} article={article} />);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,min(15rem,100%))] place-content-center gap-2 sm:gap-8 pt-2 px-4 mx-auto max-w-[68rem] relative z-10">
      {articles.map((article, i) => (
        <Fragment key={article.id}>
          {article.stocks.map((stock, stockIndex) => (
            <InStockArticleCard key={stock.uid} article={article} stockIndex={stockIndex} />
          ))}
        </Fragment>
      ))}
      {articles.length === 0 && (
        <div className="text-center text-lg font-semibold text-primary-100 col-span-full mb-16">
          Aucun article ne correspond à votre recherche
        </div>
      )}
    </div>
  );
}

const InStockArticleCard = ({ article, stockIndex }: { article: Article; stockIndex: number }) => (
  <Card
    title={article.stocks[stockIndex].title}
    description={article.stocks[stockIndex].shortDescription || article.stocks[stockIndex].description}
    image={article.stocks[stockIndex].images[0].url}
    placeholderDataUrl={article.stocks[stockIndex].images[0].placeholderDataUrl ?? undefined}
    price={applyTaxes(article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku)?.price ?? 0)}
    buttonLabelSrOnly="Découvrir"
    buttonLink={routes().shop().article(article.slug).showInStock(article.stocks[stockIndex].slug)}
    variant="default"
    stock={article.stocks[stockIndex].stock}
    rating={article.aggregatedRating ?? undefined}
  />
);
