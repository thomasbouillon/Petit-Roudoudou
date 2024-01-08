import { Article, Sku } from '@couture-next/types';
import Card from '../../card';
import { routes } from '@couture-next/routing';
import { applyTaxes } from '@couture-next/utils';

type Props = {
  article: Article;
  stockIndex: number;
};

export default function SimilarArticlesSection({ article, stockIndex }: Props) {
  if (article.stocks.length === 1) return null;
  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,min(16rem,100%))] place-content-center gap-8 px-4"
      id="[inStockArticle]similar-articles-section"
    >
      <h2 className="text-2xl font-serif col-span-full text-center">Créations similaires</h2>
      {article.stocks
        .map((stock, i) => ({
          ...stock,
          sku: article.skus.find((sku) => sku.uid === stock.sku) as Sku,
          stockIndex: i,
        }))
        .filter((stock) => stock.stockIndex !== stockIndex && stock.sku)
        .map((stock) => (
          <Card
            title={stock.title}
            description={stock.description}
            image={stock.images[0].url}
            placeholderDataUrl={stock.images[0].placeholderDataUrl}
            price={applyTaxes(stock.sku.price)}
            key={stock.uid}
            buttonLabel="Découvrir"
            buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
            variant="default"
            rating={article.aggregatedRating}
          />
        ))}
    </div>
  );
}
