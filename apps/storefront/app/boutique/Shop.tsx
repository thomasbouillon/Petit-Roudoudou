import { Article } from '@couture-next/types';
import Filters from './filters';
import Card from './card';
import { routes } from '@couture-next/routing';
import { Fragment } from 'react';
import { applyTaxes } from '@couture-next/utils';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { structuredData } from '@couture-next/seo';

type Props = {
  articles: Article[];
  disableFilters?: boolean;
  title?: string;
};

export default function Shop({ articles, title, disableFilters = false }: Props) {
  if (articles.length === 0) return <p className="mt-8 text-center">Aucun résultat, essayez d&apos;autres filtres</p>;

  return (
    <>
      <h1 className="text-3xl font-serif text-center mt-8">{title || 'Boutique'}</h1>
      <div className="bg-light-100 relative my-8">
        <div className="absolute w-full z-10">
          <div className="w-full h-[10vh] bg-white"></div>
          <div className="w-full triangle-bottom bg-white"></div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,min(24rem,100%))] place-content-center gap-8 pt-2 px-4 relative z-10">
          {disableFilters !== true && (
            <div className="flex justify-center md:justify-end col-span-full">
              <Filters />
            </div>
          )}
          <ArticlesCards articles={articles} />
        </div>
        <div className="absolute bottom-0 w-full">
          <div className="bg-white h-[20vh] w-full">
            <div className="triangle-bottom bg-light-100 w-full"></div>
          </div>
        </div>
      </div>
    </>
  );
}

const ArticlesCards = ({ articles }: { articles: Article[] }) =>
  articles.map((article) => (
    <Fragment key={article._id}>
      <WithStructuedDataWrapper stucturedData={structuredData.customizableArticle(article)}>
        <CustomArticleCard article={article} />
      </WithStructuedDataWrapper>
      {article.stocks.map((stock, i) => (
        <WithStructuedDataWrapper stucturedData={structuredData.inStockArticle(article, i)}>
          <InStockArticleCard article={article} stockIndex={i} key={stock.sku} />
        </WithStructuedDataWrapper>
      ))}
    </Fragment>
  ));

const CustomArticleCard = ({ article }: { article: Article }) => (
  <Card
    title={article.name}
    description={article.description}
    image={article.images[0].url}
    placeholderDataUrl={article.images[0].placeholderDataUrl}
    price={applyTaxes(getMinimumPriceFromSkus(article.skus))}
    key={article._id}
    buttonLabel="Sur mesure"
    buttonLink={routes().shop().customize(article.slug)}
    variant="customizable-article"
    rating={article.aggregatedRating}
  />
);

const InStockArticleCard = ({ article, stockIndex }: { article: Article; stockIndex: number }) => (
  <Card
    title={article.stocks[stockIndex].title}
    description={article.stocks[stockIndex].description}
    image={article.stocks[stockIndex].images[0].url}
    placeholderDataUrl={article.stocks[stockIndex].images[0].placeholderDataUrl}
    price={applyTaxes(article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku)?.price ?? 0)}
    buttonLabel="Découvrir"
    buttonLink={routes().shop().article(article.slug).showInStock(article.stocks[stockIndex].slug)}
    variant="default"
    stock={article.stocks[stockIndex].stock}
    rating={article.aggregatedRating}
  />
);

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));
