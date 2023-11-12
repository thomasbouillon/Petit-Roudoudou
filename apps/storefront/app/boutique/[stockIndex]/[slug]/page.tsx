'use client';

import { ButtonWithLoading, Slides } from '@couture-next/ui';
import useArticle from '../../../../hooks/useArticle';
import { useParams } from 'next/navigation';
import Card from '../../card';
import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { useCart } from '../../../../contexts/CartContext';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';

const getMinimumPriceFromSkus = (skus: Article['skus']) =>
  Math.min(...skus.map((sku) => sku.price));

export default function Page() {
  const { stockIndex, slug } = useParams();
  if (typeof slug !== 'string') throw new Error('slug is not a string');
  const stockIndexNumber = parseInt(stockIndex as string);

  const { addToCartMutation } = useCart();

  const { query } = useArticle({ slug });
  if (query.isError) throw query.error;
  if (query.isLoading) return null;

  if (query.data.stocks.length < stockIndexNumber)
    throw new Error('Stock index out of range');

  const addToCart = async () => {
    await addToCartMutation.mutateAsync({
      type: 'add-in-stock-item',
      articleId: query.data._id,
      stockUid: query.data.stocks[stockIndexNumber].uid,
    });
  };

  return (
    <div className="mt-16">
      <div className="triangle-top bg-light-100"></div>
      <div className="bg-light-100 px-4 py-8">
        <h1 className="text-serif font-serif text-3xl text-center mb-8">
          {query.data.stocks[stockIndexNumber].title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Slides
            images={query.data.stocks[stockIndexNumber].images.map((img) => ({
              url: img.url,
              alt: 'test',
              placeholderDataUrl: img.placeholderDataUrl,
            }))}
            imageLoader={loader}
            width={512}
            height={512}
            className="w-screen md:aspect-square max-w-[600px] h-[75vh] md:h-auto"
          />
          <div className="max-w-prose">
            <div>
              {query.data.stocks[stockIndexNumber].description
                .split('\n')
                .map((p, i) => (
                  <p key={i} className="text-justify">
                    {p}
                  </p>
                ))}
            </div>
          </div>
        </div>
        <ButtonWithLoading
          loading={addToCartMutation.isLoading}
          disabled={addToCartMutation.isLoading}
          className="btn btn-primary mx-auto mt-16"
          onClick={addToCart}
        >
          Ajouter au panier
        </ButtonWithLoading>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
      {query.data.stocks.length > 1 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,min(16rem,100%))] place-content-center gap-8 px-4">
            <h2 className="text-2xl font-serif col-span-full text-center">
              Créations similaires
            </h2>
            {query.data.stocks
              .filter((_, i) => i !== stockIndexNumber)
              .map((stock, i) => (
                <Card
                  title={stock.title}
                  description={stock.description}
                  image={stock.images[0].url}
                  placeholderDataUrl={stock.images[0].placeholderDataUrl}
                  price={
                    query.data.skus.find((sku) => sku.uid === stock.sku)
                      ?.price ?? 0
                  }
                  key={stock.sku + i}
                  buttonLabel="Découvrir"
                  buttonLink={routes().shop().show(i, query.data.slug)}
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
          Vous aimez notre {query.data.stocks[stockIndexNumber].title} mais vous
          souhaitez changer un tissu ? Personnalisez entièrement votre{' '}
          {query.data.name} pour le même prix !
        </p>
        <div className="w-96 max-w-full mx-auto mt-8">
          <Card
            title={query.data.name}
            description={query.data.description}
            image={query.data.images[0].url}
            placeholderDataUrl={query.data.images[0].placeholderDataUrl}
            price={getMinimumPriceFromSkus(query.data.skus)}
            buttonLabel="Personnaliser"
            buttonLink={routes().shop().customize(query.data.slug)}
            variant="customizable-article"
          />
        </div>
      </div>
      <div className="triangle-bottom bg-light-100"></div>
    </div>
  );
}
