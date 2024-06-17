'use client';

import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { Spinner } from '@couture-next/ui/Spinner';
import Card from '@couture-next/ui/card';
import { Carousel } from '@couture-next/ui/carousel';
import { applyTaxes } from '@couture-next/utils';
import { trpc } from 'apps/storefront/trpc-client';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

export type Props = {
  skip: number;
  article: Pick<Article, 'id' | 'slug' | 'skus'>;
};

export default function LazyArticleStocks({ skip, article }: Props) {
  const [enabled, setEnabled] = useState(false);
  const { ref: lastItemRef, inView } = useInView();

  const query = trpc.articles.findStocksByArticleId.useInfiniteQuery(
    {
      articleId: article.id,
      limit: 5,
    },
    {
      enabled,
      initialCursor: skip,
      getNextPageParam: (lastPage) => {
        if (lastPage.stocks.length < 5) return null;
        return lastPage.nextCursor;
      },
    }
  );

  useEffect(() => {
    if (inView && !enabled) {
      setEnabled(true);
    } else if (inView && !query.isPending) {
      query.fetchNextPage();
    }
  }, [inView]);

  const cards =
    query.data?.pages.flatMap(({ stocks }) =>
      stocks.map((stock) => (
        <Carousel.Item key={stock.uid}>
          <Card
            title={stock.title}
            image={stock.images[0].url}
            placeholderDataUrl={stock.images[0].placeholderDataUrl ?? undefined}
            price={applyTaxes(article.skus.find((sku) => sku.uid === stock.sku)?.price ?? 0)}
            buttonLabelSrOnly="Découvrir"
            buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
            variant="default"
            stock={stock.stock}
          />
        </Carousel.Item>
      ))
    ) ?? [];

  console.log(query.hasNextPage, query.isFetching);
  if (query.hasNextPage || query.isPending)
    cards.push(
      <Carousel.Item ref={lastItemRef} key="placeholder">
        <CardPlaceholder />
      </Carousel.Item>
    );

  return cards;
}

function CardPlaceholder() {
  return (
    <div className="h-full flex flex-col">
      <div className="aspect-square placeholder bg-gray-100"></div>
      <div className="bg-white grow placeholder"></div>
    </div>
  );
}
