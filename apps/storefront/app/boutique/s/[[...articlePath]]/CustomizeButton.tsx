'use client';

import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { Popover, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useBlockBodyScroll } from 'apps/storefront/contexts/BlockBodyScrollContext';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect } from 'react';

type Props = {
  articles: Article[];
};

export default function CustomizeButton({ articles }: Props) {
  // TODO improve with 3D video

  if (articles.length === 0) return null;

  if (articles.length === 1)
    return (
      <Link href={routes().shop().customize(articles[0].slug)} className="btn-primary mx-auto">
        Je réalise sur mesure
      </Link>
    );

  return (
    <Popover>
      <Popover.Button className="btn-primary mx-auto">Je réalise sur mesure</Popover.Button>
      <Transition
        as={Fragment}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Popover.Panel className="fixed top-0 left-0 z-[101] w-screen h-[100dvh] bg-white">
          {({ close }) => (
            <>
              <button type="button" onClick={() => close()} className="absolute top-0 right-0 p-2">
                <XMarkIcon className="w-6 h-6" />
                <div className="sr-only">Fermer la popup de choix de modèle</div>
              </button>
              <ChooseArticleVariantPopoverPanel articles={articles} />
            </>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

function ChooseArticleVariantPopoverPanel({ articles }: Props) {
  const blockScroll = useBlockBodyScroll();
  useEffect(() => {
    blockScroll(true);
    return () => blockScroll(false);
  }, [blockScroll]);

  if (articles.length === 0) throw 'ChooseArticleVariantPopoverPanel must be used with at least one article';

  const prices = new Set(articles[0].skus.map((sku) => sku.price));

  // characteristics are not shared so assuming that comparing sets of prices is enough
  let allPricesAreTheSame = true;
  for (let i = 1; i < articles.length; i++) {
    if (articles[i].skus.some((sku) => !prices.has(sku.price))) {
      allPricesAreTheSame = false;
      break;
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-center gap-6">
      <h2 className="text-3xl font-serif text-center">Je choisis mon modèle</h2>
      {allPricesAreTheSame && (
        <p className="text-center px-4 text-pretty">
          Les différents modèles partagent les mêmes prix. Choisis l'assemblage qui te plait.
        </p>
      )}
      <ul className="flex flex-wrap justify-center items-center gap-4 px-2">
        {articles.map((article) => (
          <li key={article.id} className="basis-[min(calc(50%-1rem),256px)] sm:basis-64 relative">
            <Image
              src={article.images[0].url}
              alt={article.name}
              width={256}
              height={256}
              loader={loader}
              className="w-64 aspect-square object-cover"
            />
            <p aria-hidden className="text-center mt-2">
              {article.name}
              {!allPricesAreTheSame && (
                <div className="block"> à partir de {getMinimumPriceFromSkus(article.skus)} €</div>
              )}
            </p>
            <Link href={routes().shop().customize(article.slug)} className="absolute top-0 left-0 bottom-0 right-0">
              <div className="sr-only">{article.name}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));
