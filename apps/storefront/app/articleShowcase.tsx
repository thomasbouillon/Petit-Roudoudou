import { Home, fetchFromCMS } from '../directus';
import { Article } from '@couture-next/types';
import ArticleThumbnail from './articleThumbnail';
import { routes } from '@couture-next/routing';
import { trpc } from '../trpc-server';
import clsx from 'clsx';

export async function ArticleShowcase() {
  const cmsHome = await fetchFromCMS<Home>('home', { fields: '*.*.*' });
  const toShow = cmsHome.articleShowcases.reduce((acc, conf) => {
    const [articleId, stockIndex] = conf.productUid.split('#');
    if (!acc[articleId]) acc[articleId] = [];
    acc[articleId].push(stockIndex ?? null);
    return acc;
  }, {} as Record<string, (string | null)[]>);

  const toShowArticleIds = Object.keys(toShow);

  const articles = (await Promise.all(
    toShowArticleIds.map((id) => trpc.articles.findById.query(id).catch(() => null))
  ).then((articles) => articles.filter((article) => article !== null))) as Article[];

  if (articles.length === 0) return null;

  return (
    <>
      <h2 className="text-4xl font-serif text-center mb-12">Vos coups de coeur du mois</h2>
      <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
        {articles.map((article, i) => (
          <>
            <ArticleComponent article={article} key={i} only={toShow[toShowArticleIds[i]]} />
          </>
        ))}
      </div>
    </>
  );
}

function ArticleComponent({ article, only }: { article: Article; only: (string | null)[] }) {
  const priceFromSku = (skuUid: string) => article.skus.find((sku) => sku.uid === skuUid)?.price;

  return (
    <>
      {only.includes(null) && (
        <ArticleThumbnail
          buttonLabel="Personnaliser"
          buttonLink={routes().shop().customize(article.slug)}
          image={article.images[0].url}
          title={article.name}
          price={Math.min(...article.skus.map((sku) => sku.price))}
          variant="customizable-article"
        />
      )}
      {article.stocks
        .filter((_, i) => only.includes('' + i))
        .map((stock) => (
          <ArticleThumbnail
            key={stock.uid}
            buttonLabel="Découvrir"
            buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
            image={stock.images[0].url}
            title={stock.title}
            price={priceFromSku(stock.sku) ?? 0}
          />
        ))}
    </>
  );
}
