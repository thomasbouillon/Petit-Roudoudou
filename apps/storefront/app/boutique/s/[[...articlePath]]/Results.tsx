import { Article } from '@couture-next/types';
import Card from '@couture-next/ui/card';
import { applyTaxes, getArticleStockPriceTaxIncluded } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import { Fragment } from 'react';
import { ArticleCarousel } from '../../../(articleCarousels)/articleCarousel';

type Props = {
  articles: Article[];
  useCarousels?: boolean;
};

export default function Results({ articles, useCarousels }: Props) {
  if (useCarousels) {
    return articles.map((article, i) => (
      <ArticleCarousel key={article.id} article={article} shouldPrioritizeFirstImage={i === 0} />
    ));
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,min(15rem,100%))] place-content-center gap-2 sm:gap-8 pt-2 px-4 mx-auto max-w-[68rem] relative z-10">
      {articles.map((article, i) => (
        <Fragment key={article.id}>
          {article.customizableVariants.length > 0 && <CustomizedCard article={article} imageIsPriority={i === 0} />}
          {article.stocks.map((stock, stockIndex) => (
            <InStockArticleCard
              key={stock.uid}
              article={article}
              stockIndex={stockIndex}
              imageIsPriority={i === 0 && stockIndex === 0}
            />
          ))}
          {/* TODO VIDEO */}
          {article.stocks.length === 0 && (
            <div className="my-6">
              <p className="text-2xl font-serif text-primary-100 text-center">Infos</p>
              <p>
                Il n'existe pas de modèles en stock pour cette création. Pas de panique, choisis tes tissus et crée ta
                propre version !
              </p>
            </div>
          )}
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

const InStockArticleCard = ({
  article,
  stockIndex,
  imageIsPriority,
}: {
  article: Article;
  stockIndex: number;
  imageIsPriority: boolean;
}) => (
  <Card
    title={article.stocks[stockIndex].title}
    description={article.stocks[stockIndex].shortDescription || article.stocks[stockIndex].description}
    image={article.stocks[stockIndex].images[0].url}
    placeholderDataUrl={article.stocks[stockIndex].images[0].placeholderDataUrl ?? undefined}
    price={getArticleStockPriceTaxIncluded(article.skus, article.stocks[stockIndex])}
    originalPrice={article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku)?.price}
    buttonLabelSrOnly="Découvrir"
    buttonLink={routes().shop().article(article.slug).showInStock(article.stocks[stockIndex].slug)}
    variant="default"
    stock={article.stocks[stockIndex].stock}
    rating={article.aggregatedRating ?? undefined}
    imageIsPriority={imageIsPriority}
  />
);

const CustomizedCard = ({ article, imageIsPriority }: { article: Article; imageIsPriority: boolean }) => (
  <Card
    title={article.name}
    description={article.shortDescription}
    image={article.images[0].url}
    placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
    price={getStartingPrice(article)}
    buttonLabelSrOnly="Découvrir"
    buttonLink={routes().shop().customize(article.slug)}
    variant="customizable-article-with-button"
    imageIsPriority={imageIsPriority}
  />
);

const getStartingPrice = (article: Article) => {
  if (article.skus.length === 0) return 0;
  let low = article.skus[0].price;
  for (const sku of article.skus) {
    if (sku.price < low) {
      low = sku.price;
    }
  }
  return applyTaxes(low);
};
