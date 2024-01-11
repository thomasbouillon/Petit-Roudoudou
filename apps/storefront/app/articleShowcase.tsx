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

export function ArticleShowcase() {
  const getCMSLinksQuery = useSuspenseQuery({
    queryKey: ['cms', 'home'],
    queryFn: () => fetchFromCMS<Home>('home', { fields: '*.*.*' }),
  });

  console.log('LOADING ATICLES');

  const db = useDatabase();

  const toShow = getCMSLinksQuery.data.articleShowcases.reduce((acc, conf) => {
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
  if (getCMSLinksQuery.isError) throw getCMSLinksQuery.error;

  return (
    <div className="grid grid-cols-2 gap-4">
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
  if (articleQuery.isError) throw articleQuery.error;
  if (articleQuery.isPending) return null;

  const article = articleQuery.data;

  const priceFromSku = (skuUid: string) => article.skus.find((sku) => sku.uid === skuUid)?.price;

  return (
    <>
      {only.includes(null) && (
        <ArticleThumbnail
          buttonLabel="Personnaliser"
          buttonLink="#TODO"
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
            buttonLink="#TODO"
            image={stock.images[0].url}
            title={stock.title}
            price={priceFromSku(stock.sku) ?? 0}
          />
        ))}
    </>
  );
}
