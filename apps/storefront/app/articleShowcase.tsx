'use client';

import {
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryResult,
  useQueries,
  useSuspenseQueries,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { Home, fetchFromCMS } from '../directus';
import { collection, doc, getDoc } from 'firebase/firestore';
import useDatabase from '../hooks/useDatabase';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { Article } from '@couture-next/types';
import ArticleThumbnail from './articleThumbnail';
import { routes } from '@couture-next/routing';

export function ArticleShowcase() {
  const getCMSQuery = useSuspenseQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });

  const db = useDatabase();

  const toShow = getCMSQuery.data.articleShowcases.reduce((acc, conf) => {
    const [articleId, stockIndex] = conf.productUid.split('#');
    if (!acc[articleId]) acc[articleId] = [];
    acc[articleId].push(stockIndex ?? null);
    return acc;
  }, {} as Record<string, (string | null)[]>);

  const toShowArticleIds = Object.keys(toShow);

  const getArticlesQuery = useSuspenseQueries({
    queries: toShowArticleIds.map(
      (id) =>
        ({
          queryKey: ['articles', id],
          queryFn: () =>
            getDoc(doc(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>()), id)).then(
              (snapshot) => {
                if (!snapshot.exists()) throw new Error(`Article with id ${id} does not exist`);
                return snapshot.data();
              }
            ),
        } satisfies UseQueryOptions<Article>)
    ),
  });
  if (getCMSQuery.isError) throw getCMSQuery.error;

  return (
    <div className="grid grid-cols-2 gap-4 max-w-xl">
      {getArticlesQuery.map((articleQuery, i) => (
        <ArticleComponent articleQuery={articleQuery} key={i} only={toShow[toShowArticleIds[i]]} />
      ))}
    </div>
  );
}

function ArticleComponent({
  articleQuery,
  only,
}: {
  articleQuery: UseSuspenseQueryResult<Article>;
  only: (string | null)[];
}) {
  if (articleQuery.isError) return null;
  if (articleQuery.isPending) return null;

  const article = articleQuery.data;

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
