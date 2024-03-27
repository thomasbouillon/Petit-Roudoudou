'use client';

import algoliasearch from 'algoliasearch/lite';
import { Combobox, Popover } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Article } from '@couture-next/types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { useBlockBodyScroll } from '../contexts/BlockBodyScrollContext';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { usePathname } from 'next/navigation';

const algoliaClient = algoliasearch('LF603CVYRR', '2d8d7a670034bf5fe18fa59ff7ffc25b');

export function SearchArticles({ buttonRef }: { buttonRef?: React.RefObject<HTMLButtonElement> }) {
  return (
    <Popover className="flex items-center">
      <Popover.Button aria-label="Rechercher dans la boutique" className="ui-open:hidden" ref={buttonRef}>
        <MagnifyingGlassIcon className="w-7 h-7 text-primary-100" />
      </Popover.Button>
      <Popover.Panel>{({ close }) => <SearchPanel close={close} />}</Popover.Panel>
    </Popover>
  );
}

function SearchPanel({ close }: { close: () => void }) {
  const blockBodyScroll = useBlockBodyScroll();
  const pathname = usePathname();
  const pathWhenMounted = useRef(pathname);

  useEffect(() => {
    blockBodyScroll(true);
  }, []);

  const renderCancelButton = useCallback(
    () => (
      <button aria-label="Annuler et fermer la popup" onClick={close} className="md:hidden">
        Annuler
      </button>
    ),
    [close]
  );

  useEffect(() => {
    if (pathWhenMounted.current !== pathname) close();
  }, [pathname]);

  return (
    <div
      className={clsx(
        'fixed top-0 left-0 w-full h-full bg-white z-20 pt-8 p-4',
        'md:relative md:w-auto md:h-auto md:p-0'
      )}
    >
      <Search renderCancelButton={renderCancelButton} />
    </div>
  );
}

function Search({ renderCancelButton }: { renderCancelButton: () => React.ReactElement }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 100);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchClient = useMemo(() => algoliaClient.initIndex('petit-roudoudou-articles'), []);

  const searchQuery = useQuery({
    queryKey: ['search', 'articles', debouncedQuery],
    queryFn: () => searchClient.search<Article>(debouncedQuery),
  });

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.focus();
  }, [inputRef.current]);

  return (
    <Combobox>
      <div className="relative flex gap-2">
        <Combobox.Input
          className="border rounded-full pl-12 pr-4 py-2 w-full flex-grow"
          onChange={(e) => setQuery(e.target.value)}
          value={query}
          ref={inputRef}
        />
        <MagnifyingGlassIcon className="w-9 h-9 absolute left-1 top-1/2 -translate-y-1/2 bg-light-100 rounded-full p-2" />
        {renderCancelButton()}
      </div>
      <Combobox.Options className="bg-white mt-8 px-4 md:absolute md:mt-2 md:border md:rounded-md md:w-full">
        {searchQuery.data?.hits.map((searchResult) => (
          <Combobox.Option value={searchResult._id} key={searchResult._id}>
            <Link
              className="flex justify-between py-2 underline"
              href={routes().shop().article(searchResult.slug).index()}
            >
              {searchResult.name}
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
}
