'use client';

import Card from './card';
import { routes } from '@couture-next/routing';
import { Fragment, PropsWithChildren } from 'react';
import { applyTaxes } from '@couture-next/utils';
import { WithStructuedDataWrapper } from '@couture-next/ui';
import { structuredData } from '@couture-next/seo';
import env from '../../env';
import { Article } from '@couture-next/types';
import { useSearchParams } from 'next/navigation';

type Props = PropsWithChildren<{
  titleAs?: 'h1' | 'h2';
  articles: Article[];
  title?: string;
}>;

export default function Shop({ articles, title, titleAs, children }: Props) {
  const searchParams = useSearchParams();
  const customizableOnly = searchParams.get('customizableOnly') === 'true';
  if (articles.length === 0) return <p className="mt-8 text-center">Aucun résultat, essaye d&apos;autres filtres</p>;

  const TitleAs = titleAs ?? 'h1';

  return (
    <>
      <TitleAs className="text-3xl font-serif text-center my-8">{title || 'Boutique'}</TitleAs>
      {children}
      <div className="bg-light-100 relative my-8">
        <div className="absolute w-full z-10">
          <div className="w-full h-[10vh] bg-white"></div>
          <div className="w-full triangle-bottom bg-white"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,min(15rem,100%))] place-content-center gap-2 sm:gap-8 pt-2 px-4 relative z-10">
          <ArticlesCards articles={articles} appendArticleStocks={!customizableOnly} />
          {articles.length === 1 && articles[0].stocks.length === 0 && (
            <div className="flex items-center">
              <p className="bg-white p-4 rounded shadow-md">
                <h2 className="text-primary font-serif text-primary-100 text-2xl text-center">Info</h2>
                Il n'existe pas de modèles en stock pour cette création. Pas de panique, choisis tes tissus et crée ta
                propre version !
              </p>
            </div>
          )}
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
    <Fragment key={article.id}>
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
    description={article.shortDescription}
    image={article.images[0].url}
    placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
    price={applyTaxes(getMinimumPriceFromSkus(article.skus))}
    key={article.id}
    buttonLabelSrOnly="Je choisis mes tissus"
    buttonLink={routes().shop().customize(article.slug)}
    variant="customizable-article"
    rating={article.aggregatedRating ?? undefined}
    imageIsPriority={isFirst}
  />
);

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

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));
