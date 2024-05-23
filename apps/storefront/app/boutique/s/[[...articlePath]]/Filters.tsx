'use client';

import { explodeShopArticlePath, routes } from '@couture-next/routing';
import { Popover, RadioGroup, Transition } from '@headlessui/react';
import { useBlockBodyScroll } from 'apps/storefront/contexts/BlockBodyScrollContext';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import { useParams, useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

export default function Filters() {
  return (
    <Popover className="">
      <Popover.Button className="btn-secondary mx-auto">Filtres</Popover.Button>
      <Transition
        as={Fragment}
        enter="transition-transform duration-300"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition-transform duration-300"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <Popover.Panel className="fixed top-0 left-0 right-0 bottom-0 overflow-y-scroll w-full p-4 bg-white z-[101]">
          {({ close }) => <PopoverPanel close={close} />}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

function PopoverPanel({ close }: { close: () => void }) {
  const articlesQuery = trpc.articles.list.useQuery();
  const articleThemesQuery = trpc.articleThemes.list.useQuery();

  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const pageParams = useParams();
  const currentSelectionFromPageParams = useMemo(() => {
    const parsed = explodeShopArticlePath(pageParams.articlePath as string[]);
    return parsed ? `${parsed.discriminator}/${parsed.slug}` : null;
  }, [pageParams.articlePath]);
  // Sync selection with URL
  useEffect(() => {
    setSelected(currentSelectionFromPageParams);
  }, [currentSelectionFromPageParams]);

  const blockScroll = useBlockBodyScroll();
  useEffect(() => {
    blockScroll(true);
    return () => blockScroll(false);
  }, [blockScroll]);

  const optionClassName = clsx(
    'mx-6 relative py-2 !outline-none cursor-pointer',
    'ui-not-checked:before:opacity-0 before:transition-opacity before:content-[""] before:bg-primary-100 before:rounded-full before:w-2 before:h-2 before:absolute before:top-1/2 before:-translate-y-1/2 before:-translate-x-3  before:right-full',
    'after:content-[""] after:border after:rounded-full after:w-4 after:h-4 after:absolute after:top-1/2 after:-translate-y-1/2 after:-translate-x-2 after:right-full after:border-primary-100 after:border-solid after:border-2'
  );

  const apply = useCallback(
    (selected: string | null) => {
      const [discriminator, slug] = selected?.split('/') ?? [];
      const route =
        discriminator === 't'
          ? routes().shop().theme(slug).index()
          : discriminator === 'a'
          ? routes().shop().article(slug).index()
          : routes().shop().index();

      router.push(route);
      close();
    },
    [close, router.push]
  );

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full gap-4">
      <h2 className="text-lg font-semibold col-span-full text-center">Filtres</h2>
      <RadioGroup className="relative grow overflow-auto" value={selected} onChange={setSelected}>
        <RadioGroup.Option value={null} className={optionClassName}>
          Toutes les créations
        </RadioGroup.Option>
        {!!articleThemesQuery.data && articleThemesQuery.data?.length > 0 && (
          <>
            <RadioGroup.Label className="text-lg font-semibold mt-6 block">Thèmes</RadioGroup.Label>
            {articleThemesQuery.data?.map((theme) => (
              <RadioGroup.Option key={theme.id} value={`t/${theme.slug}`} className={optionClassName}>
                {theme.name}
              </RadioGroup.Option>
            ))}
          </>
        )}
        <RadioGroup.Label className="text-lg font-semibold mt-6 block">Créations</RadioGroup.Label>
        {articlesQuery.data?.map((article) => (
          <RadioGroup.Option key={article.id} value={`a/${article.slug}`} className={optionClassName}>
            {article.name}
          </RadioGroup.Option>
        ))}
      </RadioGroup>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={close}>
          Annuler
        </button>
        <button type="button" className="btn-primary flex-1" onClick={() => apply(selected)}>
          Appliquer
        </button>
      </div>
    </div>
  );
}
