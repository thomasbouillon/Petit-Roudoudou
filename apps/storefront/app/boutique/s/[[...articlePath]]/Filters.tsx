'use client';

import { explodeShopArticlePath, routes } from '@couture-next/routing';
import {
  RadioGroup,
  Transition,
  Radio,
  Dialog,
  DialogPanel,
  CloseButton,
  DialogTitle,
  useClose,
} from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function Filters() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn-secondary mx-auto"
        aria-label="Ouvrir la fenêtre pour choisir les filtres"
        onClick={() => {
          console.log('HELLO ?');
          setOpen(true);
        }}
      >
        Filtres
      </button>
      <Transition
        show={open}
        enter="transition-transform duration-300"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition-transform duration-300"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <Dialog
          onClose={() => setOpen(false)}
          className="fixed top-0 left-0 right-0 bottom-0 overflow-y-scroll w-full p-4 bg-white z-[101]"
        >
          <DialogPanel>
            <DialogPanelContent />
          </DialogPanel>
        </Dialog>
      </Transition>
    </>
  );
}

function DialogPanelContent() {
  const articlesQuery = trpc.articles.list.useQuery();
  const articleThemesQuery = trpc.articleThemes.list.useQuery();
  const close = useClose();

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

  const radioClassName = clsx(
    'block relative mx-6 py-2 py-2 !outline-none cursor-pointer',
    'before:opacity-0 data-[checked]:before:opacity-100 before:transition-opacity before:content-[""] before:bg-primary-100 before:rounded-full before:w-2 before:h-2 before:absolute before:top-1/2 before:-translate-y-1/2 before:-translate-x-3  before:right-full',
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
      <DialogTitle className="text-lg font-semibold col-span-full text-center data-">Filtres</DialogTitle>
      <RadioGroup className="relative grow overflow-auto" value={selected} onChange={setSelected}>
        <Radio value={null} className={radioClassName}>
          Toutes les créations
        </Radio>
        {!!articleThemesQuery.data && articleThemesQuery.data?.length > 0 && (
          <fieldset>
            <legend className="text-lg font-semibold mt-6 block">Thèmes</legend>
            {articleThemesQuery.data?.map((theme) => (
              <Radio value={`t/${theme.slug}`} className={radioClassName}>
                {theme.name}
              </Radio>
            ))}
          </fieldset>
        )}
        <fieldset>
          <legend className="text-lg font-semibold mt-6 block">Créations</legend>
          {articlesQuery.data?.map((article) => (
            <Radio value={`a/${article.slug}`} className={radioClassName}>
              {article.name}
            </Radio>
          ))}
        </fieldset>
      </RadioGroup>
      <div className="flex gap-2">
        <CloseButton onClick={close} className="btn-secondary flex-1">
          Annuler
        </CloseButton>
        <button type="button" className="btn-primary flex-1" onClick={() => apply(selected)}>
          Appliquer
        </button>
      </div>
    </div>
  );
}
