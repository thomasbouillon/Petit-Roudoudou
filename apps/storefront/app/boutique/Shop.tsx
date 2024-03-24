import { Article } from '@couture-next/types';
import Card from './card';
import { routes } from '@couture-next/routing';
import { Fragment, PropsWithChildren } from 'react';
import { applyTaxes } from '@couture-next/utils';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { structuredData } from '@couture-next/seo';
import env from '../../env';

type Props = PropsWithChildren<{
  articles: Article[];
  title?: string;
  appendArticleStocks?: boolean;
}>;

export default function Shop({ articles, title, appendArticleStocks = true, children }: Props) {
  if (articles.length === 0) return <p className="mt-8 text-center">Aucun résultat, essayez d&apos;autres filtres</p>;

  return (
    <>
      <h1 className="text-3xl font-serif text-center mt-8">{title || 'Boutique'}</h1>
      {children}
      <div className="bg-light-100 relative my-8">
        <div className="absolute w-full z-10">
          <div className="w-full h-[10vh] bg-white"></div>
          <div className="w-full triangle-bottom bg-white"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,min(16rem,100%))] place-content-center gap-2 sm:gap-8 pt-2 px-4 relative z-10">
          <ArticlesCards articles={articles} appendArticleStocks={appendArticleStocks} />
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

const ArticlesCards = ({ articles, appendArticleStocks }: { articles: Article[]; appendArticleStocks: boolean }) =>
  articles.map((article, i) => (
    <Fragment key={article._id}>
      <WithStructuedDataWrapper stucturedData={structuredData.customizableArticle(article, env.CDN_BASE_URL)}>
        <CustomArticleCard article={article} isFirst={i === 0} />
      </WithStructuedDataWrapper>
      {appendArticleStocks &&
        article.stocks.map((stock, i) => (
          <WithStructuedDataWrapper
            stucturedData={structuredData.inStockArticle(article, i, env.CDN_BASE_URL)}
            key={stock.sku}
          >
            <InStockArticleCard article={article} stockIndex={i} />
          </WithStructuedDataWrapper>
        ))}
    </Fragment>
  ));

const CustomArticleCard = ({ article, isFirst }: { article: Article; isFirst: boolean }) => (
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
    imageIsPriority={isFirst}
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
