import { Slides, WithStructuedDataWrapper } from '@couture-next/ui';
import Card from '../../card';
import { routes } from '@couture-next/routing';
import { Article, Sku, StructuredDataProduct } from '@couture-next/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from '../../../../hooks/useDatabase';
import { cache } from 'react';
import AddToCartButton from './AddToCartButton';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';

const getMinimumPriceFromSkus = (skus: Article['skus']) =>
  Math.min(...skus.map((sku) => sku.price));

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

type Props = {
  params: {
    slug: string;
    stockIndex: string;
  };
};

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

export const generateMetadata = async ({
  params: { slug, stockIndex },
}: Props) => {
  const article = await cachedArticleBySlugFn(slug);

  return {
    title: article.stocks[parseInt(stockIndex)].title,
    description: article.stocks[parseInt(stockIndex)].description,
    // structuredData: getStructuredData(article, parseInt(stockIndex)),
  };
};

export default async function Page({ params: { slug, stockIndex } }: Props) {
  const article = await cachedArticleBySlugFn(slug);
  const stockIndexNumber = parseInt(stockIndex);

  if (article.stocks.length < stockIndexNumber)
    throw new Error('Stock index out of range');

  return (
    <WithStructuedDataWrapper<'div'>
      as="div"
      stucturedData={getStructuredData(article, stockIndexNumber)}
    >
      <div className="triangle-top bg-light-100"></div>
      <div className="bg-light-100 px-4 py-8">
        <h1 className="text-serif font-serif text-3xl text-center mb-8">
          {article.stocks[stockIndexNumber].title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Slides
            images={article.stocks[stockIndexNumber].images.map((img) => ({
              url: img.url,
              alt: 'test',
              placeholderDataUrl: img.placeholderDataUrl,
            }))}
            width={512}
            height={512}
            imageLoader={loader}
            className="w-screen md:aspect-square max-w-[600px] h-[75vh] md:h-auto"
          />
          <div className="max-w-prose">
            <div>
              {article.stocks[stockIndexNumber].description
                .split('\n')
                .map((p, i) => (
                  <p key={i} className="text-justify">
                    {p}
                  </p>
                ))}
            </div>
          </div>
        </div>
        <AddToCartButton
          payload={{
            type: 'add-in-stock-item',
            articleId: article._id,
            stockUid: article.stocks[stockIndexNumber].uid,
          }}
        />
      </div>
      <div className="triangle-bottom bg-light-100"></div>
      {article.stocks.length > 1 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,min(16rem,100%))] place-content-center gap-8 px-4">
            <h2 className="text-2xl font-serif col-span-full text-center">
              Créations similaires
            </h2>
            {article.stocks
              .map((stock, i) => ({
                ...stock,
                sku: article.skus.find((sku) => sku.uid === stock.sku) as Sku,
                stockIndex: i,
              }))
              .filter(
                (stock) => stock.stockIndex !== stockIndexNumber && stock.sku
              )
              .map((stock) => (
                <Card
                  title={stock.title}
                  description={stock.description}
                  image={stock.images[0].url}
                  placeholderDataUrl={stock.images[0].placeholderDataUrl}
                  price={stock.sku.price}
                  key={stock.uid}
                  buttonLabel="Découvrir"
                  buttonLink={routes()
                    .shop()
                    .show(stock.stockIndex, article.slug)}
                  variant="default"
                />
              ))}
          </div>
        </>
      )}
      <div className="triangle-top bg-light-100 mt-16"></div>
      <div className="px-4 bg-light-100 py-8">
        <h2 className="text-2xl font-serif text-center ">Sur mesure</h2>
        <p className="mt-8 max-w-prose text-justify mx-auto">
          Vous aimez notre {article.stocks[stockIndexNumber].title} mais vous
          souhaitez changer un tissu ? Personnalisez entièrement votre{' '}
          {article.name} pour le même prix !
        </p>
        <div className="w-96 max-w-full mx-auto mt-8">
          <Card
            title={article.name}
            description={article.description}
            image={article.images[0].url}
            placeholderDataUrl={article.images[0].placeholderDataUrl}
            price={getMinimumPriceFromSkus(article.skus)}
            buttonLabel="Personnaliser"
            buttonLink={routes().shop().customize(article.slug)}
            variant="customizable-article"
          />
        </div>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
    </WithStructuedDataWrapper>
  );
}
