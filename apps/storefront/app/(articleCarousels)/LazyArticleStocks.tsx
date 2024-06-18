'use client';

import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import Card from '@couture-next/ui/card';
import { Carousel } from '@couture-next/ui/carousel';
import { applyTaxes } from '@couture-next/utils';
import { trpc } from 'apps/storefront/trpc-client';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

export type Props = {
  skip: number;
  article: Pick<Article, 'id' | 'slug'>;
  stockUidBlacklist?: string[];
  skuPrices: Record<string, number>;
};

export default function LazyArticleStocks({ skip, article, stockUidBlacklist, skuPrices }: Props) {
  const [enabled, setEnabled] = useState(false);
  const { ref: lastItemRef, inView } = useInView();

  const query = trpc.articles.findStocksByArticleId.useInfiniteQuery(
    {
      blacklistedStockUids: stockUidBlacklist,
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
            price={applyTaxes(skuPrices[stock.sku] ?? 0)}
            buttonLabelSrOnly="Découvrir"
            buttonLink={routes().shop().article(article.slug).showInStock(stock.slug)}
            variant="default"
            stock={stock.stock}
          />
        </Carousel.Item>
      ))
    ) ?? [];

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
