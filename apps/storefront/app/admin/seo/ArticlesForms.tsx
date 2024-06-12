/* eslint-disable react/jsx-key */
'use client';

import { Article } from '@couture-next/types';
import { Tab } from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import ArticleSeoFormWrapper from './ArticleSeoFormWrapper';
import ArticleStockSeoField from './ArticleStockSeoField';
import ArticleSeoField from './ArticleSeoField';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';

export default function ArticlesForms() {
  const articlesQuery = trpc.articles.list.useQuery();

  return (
    <Tab.Group as="div" className="grid sm:grid-cols-[auto_1fr] gap-4">
      <Tab.List className="grid grid-cols-[repeat(auto-fill,4rem)] place-content-start py-2 gap-2 sm:max-h-[calc(100dvh-9rem)] px-4 overflow-y-auto h-full border w-full min-w-80 max-h-40 sm:max-w-sm">
        {articlesQuery.data?.map((article) => {
          let errors = 0;
          if (article.seo.description.length < 90 || article.seo.description.length > 150) {
            errors++;
          }
          if (article.seo.title.length < 44 || article.seo.title.length > 54) {
            errors++;
          }
          article.stocks.forEach((stock) => {
            if (stock.seo.description.length < 90 || stock.seo.description.length > 150) {
              errors++;
            }
            if (stock.seo.title.length < 44 || stock.seo.title.length > 54) {
              errors++;
            }
          });
          return (
            <Tab className="aspect-square !outline-none relative">
              <Image
                src={article.images[0].url}
                loader={loader}
                width={64}
                height={64}
                alt={article.name}
                className="w-16 aspect-square object-contain object-center ui-selected:outline outline-primary-100"
              />
              {errors >= 4 && (
                <div className="rounded-full bg-red-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
              {errors >= 1 && errors <= 3 && (
                <div className="rounded-full bg-orange-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
              {errors === 0 && (
                <div className="rounded-full bg-green-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
            </Tab>
          );
        })}
      </Tab.List>
      <Tab.Panels>
        {articlesQuery.data?.map((article) => (
          <Tab.Panel className="!outline-none sm:max-h-[calc(100dvh-9rem)] sm:h-full sm:overflow-y-scroll">
            <ArticleSeoFormWrapper article={article as Article}>
              <ArticleSeoField title={article.name} />
              <h3 className="font-bold mt-6 mb-4">Stocks</h3>
              <InStockArticlesTabs article={article as Article} />
            </ArticleSeoFormWrapper>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}

function InStockArticlesTabs({ article }: { article: Article }) {
  if (!article.stocks.length) return <p>Aucun stock disponible</p>;
  return (
    <Tab.Group as="div" className="grid sm:grid-cols-[auto_1fr] gap-4 sm:h-full">
      <Tab.List className="grid grid-cols-[repeat(auto-fill,4rem)] place-content-start min-w-80 justify-center py-2 gap-2 px-4 overflow-y-auto sm:h-full border sm:max-w-sm w-full h-40 sm:max-h-auto">
        {article.stocks.map((stock) => {
          let errors = 0;
          if (stock.seo.description.length < 90 || stock.seo.description.length > 150) {
            errors++;
          }
          if (stock.seo.title.length < 44 || stock.seo.title.length > 54) {
            errors++;
          }
          const dotcolor = errors >= 4 ? 'red' : errors >= 1 && errors <= 3 ? 'orange' : 'green';
          return (
            <Tab className="!outline-none relative">
              <Image
                src={stock.images[0].url}
                loader={loader}
                width={64}
                height={64}
                alt={stock.title}
                className="w-16 aspect-square object-contain object-center ui-selected:outline outline-primary-100 ui-not-selected:outline-none"
              />
              {errors >= 4 && (
                <div className="rounded-full bg-red-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
              {errors >= 1 && errors <= 3 && (
                <div className="rounded-full bg-orange-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
              {errors === 0 && (
                <div className="rounded-full bg-green-600 w-4 p-2 absolute bottom-0.5 right-0.5 border border-black "></div>
              )}
            </Tab>
          );
        })}
      </Tab.List>
      <Tab.Panels className="sm:h-full">
        {article.stocks.map((stock, i) => (
          <Tab.Panel className="border p-4 sm:h-full sm:overflow-y-auto">
            <ArticleStockSeoField stockIndex={i} title={stock.title} />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
