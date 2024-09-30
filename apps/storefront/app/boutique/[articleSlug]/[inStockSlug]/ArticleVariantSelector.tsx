import { Article } from '@couture-next/types';
import clsx from 'clsx';
import { Fragment, useMemo } from 'react';
import ArticleStockFabricsPreview from './ArticleStockFabricsPreview';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { Popover, PopoverBackdrop, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import ManufacturingTimes from 'apps/storefront/app/manufacturingTimes';
import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import env from 'apps/storefront/env';
import CustomizedArticleDemo from '@couture-next/ui/CustomizedArticleDemo';

type Props = {
  article: Article;
  currentStock: Article['stocks'][number];
};

export default function ArticleVariantSelector({ article, currentStock }: Props) {
  const currentSku = useMemo(
    () => article.skus.find((s) => s.uid === currentStock.sku),
    [article.skus, currentStock.sku]
  );
  if (!currentSku) throw new Error('currentSku not found');

  const similarSkus = useMemo(
    () => article.skus.filter((s) => currentSku.customizableVariantUid === s.customizableVariantUid),
    [article.skus, currentSku.customizableVariantUid]
  );

  const characteristics = useMemo(
    () =>
      Object.entries(article.characteristics)
        .map(([uid, characteristic]) => ({
          ...characteristic,
          uid,
          values: Object.entries(characteristic.values)
            .map(([valueUid, label]) => {
              const matchingSkus = similarSkus.filter((s) => s.characteristics[uid] === valueUid).map((s) => s.uid);
              const firstStock = article.stocks.find((s) => matchingSkus.includes(s.sku) && s.stock > 0);

              return {
                label,
                uid: valueUid,
                matchingSkuCount: matchingSkus.length,
                firstStock,
              };
            })
            .filter((v) => v.matchingSkuCount > 0),
        }))
        .filter((c) => c.values.length > 1),
    [article.characteristics, similarSkus, article.stocks]
  );

  const stocksFromCurrrentSku = article.stocks.filter((s) => s.sku === currentSku.uid);

  return (
    <div className="space-y-4">
      {characteristics.map((c) => (
        <div key={c.uid}>
          <h2>{c.label}</h2>
          <ul className="grid grid-cols-2 gap-2">
            {c.values.map((v) => (
              <li
                key={v.uid}
                className={clsx(
                  'border-2 bg-white',
                  currentSku.characteristics[c.uid] === v.uid && 'border-primary-100'
                )}
              >
                {!!v.firstStock && currentSku.characteristics[c.uid] !== v.uid ? (
                  <Link
                    className="p-2 block"
                    href={routes().shop().article(article.slug).showInStock(v.firstStock.slug)}
                    replace
                  >
                    {v.label}
                  </Link>
                ) : currentSku.characteristics[c.uid] === v.uid ? (
                  <Link
                    className="p-2 block"
                    href={routes().shop().article(article.slug).showInStock(currentStock.slug)}
                    replace
                  >
                    {v.label}
                  </Link>
                ) : (
                  <button className="p-2 block cursor-not-allowed text-gray-500 w-full text-start" disabled>
                    {v.label}
                    <span className="sr-only">(Indisponible)</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {stocksFromCurrrentSku.length > 0 && (
        <div>
          <h2>Tissus</h2>
          <ul className="grid grid-cols-6 gap-4">
            {stocksFromCurrrentSku.map((s) => (
              <li
                key={s.uid}
                className={clsx('relative', currentStock.uid === s.uid && 'outline outline-2 outline-primary-100')}
              >
                <Link
                  href={routes().shop().article(article.slug).showInStock(s.slug)}
                  replace
                  className={(s.stock === 0 && 'opacity-50') || ''}
                >
                  <ArticleStockFabricsPreview fabricIds={s.fabricIds} />
                </Link>
                {s.stock === 0 && (
                  <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-center text-xs font-bold">
                    SOLD OUT
                  </span>
                )}
              </li>
            ))}
            {!!currentSku.customizableVariantUid && (
              <li>
                <CustomizePopover articleSlug={article.slug} />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function CustomizePopover({ articleSlug }: { articleSlug: string }) {
  return (
    <Popover>
      <PopoverButton className="flex items-center  aspect-square w-full !outline-none">
        <span className="sr-only">Voir plus</span>
        <PlusCircleIcon className="w-8 h-8 text-primary-100" />
      </PopoverButton>
      <PopoverBackdrop
        className="fixed inset-0 z-10 bg-black bg-opacity-20 data-[closed]:opacity-0 transition-opacity"
        transition
      />
      <PopoverPanel
        modal
        transition
        className={clsx(
          'fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[100dvh] overflow-y-auto',
          'transition data-[closed]:scale-95 data-[closed]:opacity-0'
        )}
      >
        <div className="relative bg-white rounded-sm max-w-md px-4 py-8">
          <p className="text-center text-3xl font-serif mb-6">Sur mesure</p>
          <div className="flex justify-center">
            <CustomizedArticleDemo />
          </div>
          <p className="mt-6">Choisis tous les tissus toi même</p>
          <ul className="list-disc list-inside">
            <li>Aperçu 3D</li>
            <li>Une centaine de tissus disponibles</li>
            <li>
              <ManufacturingTimes as={Fragment} />
            </li>
          </ul>
          <Link href={routes().shop().customize(articleSlug)} className="btn-primary mt-6 mx-auto">
            Personnaliser
          </Link>
          <PopoverButton className="absolute right-2 top-2">
            <XMarkIcon className="w-8 h-8" />
            <span className="sr-only">Fermer</span>
          </PopoverButton>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
