import { Article, StructuredDataProduct } from '@couture-next/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from '../../../../hooks/useDatabase';
import { cache } from 'react';
import { firebaseServerImageLoader as loader } from '@couture-next/utils';
import { notFound } from 'next/navigation';
import ArticleSection from './ArticleSection';
import SimilarArticlesSection from './SimilarArticlesSection';
import CustomArticleSection from './CustomArticleSection';

type Props = {
  params: {
    articleSlug: string;
    inStockSlug: string;
  };
};

export const generateMetadata = async ({
  params: { articleSlug, inStockSlug },
}: Props) => {
  const article = await cachedArticleBySlugFn(articleSlug);
  const stockIndex = article.stocks.findIndex(
    (stock) => stock.slug === inStockSlug
  );

  return {
    title: article.stocks[stockIndex].title,
    description: article.stocks[stockIndex].description,
    structuredData: getStructuredData(article, stockIndex),
  };
};

export default async function Page({
  params: { articleSlug, inStockSlug },
}: Props) {
  const article = await cachedArticleBySlugFn(articleSlug);
  const stockIndex = article.stocks.findIndex(
    (stock) => stock.slug === inStockSlug
  );

  if (stockIndex < 0) return notFound();
  if (article.stocks.length < stockIndex)
    throw new Error('Stock index out of range');

  return (
    <div>
      <ArticleSection article={article} stockIndex={stockIndex} />
      <SimilarArticlesSection article={article} stockIndex={stockIndex} />
      <CustomArticleSection article={article} stockIndex={stockIndex} />
    </div>
  );
}

const cachedArticleBySlugFn = cache(async (slug: string) => {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'articles'),
      where('slug', '==', slug)
    ).withConverter(firestoreConverterAddRemoveId<Article>())
  );
  if (snapshot.empty) throw Error('Not found');
  const article = snapshot.docs[0].data();
  return article;
});

const getStructuredData = (
  article: Article,
  stockIndex: number
): StructuredDataProduct => ({
  '@type': 'Product',
  name: article.stocks[stockIndex].title,
  description: article.stocks[stockIndex].description,
  image: loader({
    src: article.stocks[stockIndex].images[0].url,
    width: 512,
  }),
  offers: {
    '@type': 'Offer',
    price:
      article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku)
        ?.price ?? 0,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(new Date().getTime() + 31536000000).toISOString(),
  },
});
