'use client';

import { Article } from '@couture-next/types';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import ArticleSeoFormWrapper from './ArticleSeoFormWrapper';
import ArticleStockSeoField from './ArticleStockSeoField';
import ArticleSeoField from './ArticleSeoField';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';

export default function ArticlesForms() {
  const articlesQuery = trpc.articles.list.useQuery();

  return (
    <TabGroup as="div" className="grid sm:grid-cols-[auto_1fr] gap-4">
      <TabList className="grid grid-cols-[repeat(auto-fill,4rem)] place-content-start py-2 gap-2 sm:max-h-[calc(100dvh-9rem)] px-4 overflow-y-auto h-full border w-full min-w-80 max-h-40 sm:max-w-sm">
        {articlesQuery.data?.map((article) => (
          <Tab className="aspect-square !outline-none group">
            <Image
              src={article.images[0].url}
              loader={loader}
              width={64}
              height={64}
              alt={article.name}
              className="w-16 aspect-square object-contain object-center group-data-[selected]:outline outline-primary-100"
            />
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {articlesQuery.data?.map((article) => (
          <TabPanel className="!outline-none sm:max-h-[calc(100dvh-9rem)] sm:h-full sm:overflow-y-scroll">
            <ArticleSeoFormWrapper article={article as Article}>
              <ArticleSeoField title={article.name} />
              <h3 className="font-bold mt-6 mb-4">Stocks</h3>
              <InStockArticlesTabs article={article as Article} />
            </ArticleSeoFormWrapper>
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}

function InStockArticlesTabs({ article }: { article: Article }) {
  if (!article.stocks.length) return <p>Aucun stock disponible</p>;
  return (
    <TabGroup as="div" className="grid sm:grid-cols-[auto_1fr] gap-4 sm:h-full">
      <TabList className="grid grid-cols-[repeat(auto-fill,4rem)] place-content-start min-w-80 justify-center py-2 gap-2 px-4 overflow-y-auto sm:h-full border sm:max-w-sm w-full h-40 sm:max-h-auto">
        {article.stocks.map((stock) => (
          <Tab className="!outline-none group">
            <Image
              src={stock.images[0].url}
              loader={loader}
              width={64}
              height={64}
              alt={stock.title}
              className="w-16 aspect-square object-contain object-center group-data-[selected]:outline outline-primary-100"
            />
          </Tab>
        ))}
      </TabList>
      <TabPanels className="sm:h-full">
        {article.stocks.map((stock, i) => (
          <Tab.Panel className="border p-4 sm:h-full sm:overflow-y-auto">
            <ArticleStockSeoField stockIndex={i} title={stock.title} />
          </Tab.Panel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
