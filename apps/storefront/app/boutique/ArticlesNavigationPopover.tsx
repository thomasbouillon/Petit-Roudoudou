'use client';

import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { Popover, Transition } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  articles: Article[];
};

export function ArticlesNavigationPopover({ articles }: Props) {
  if (articles.length === 0) return null;
  return (
    <Popover>
      <Popover.Button className="btn-secondary mx-auto">Filtrer par catégorie</Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel className="absolute z-20 left-1/2 -translate-x-1/2 translate-y-4 w-full max-w-prose p-4">
          {({ close }) => (
            <div className="relative bg-white p-6 border rounded shadow-md">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <h2 className="text-lg underline">Toutes les catégories:</h2>
                <button type="button" onClick={() => close()} aria-label="Fermer la popup">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <nav aria-label="Navigation parmis les articles" className=" mt-4">
                <ul className="empty:hidden grid grid-cols-[repeat(auto-fill,minmax(28ch,1fr))] items-center gap-2">
                  {articles.map((article) => (
                    <li className="relative pr-5 !outline-none border rounded-full" key={article.id}>
                      <Link href={routes().shop().article(article.slug).index()} className="w-full block px-4 py-2">
                        {article.namePlural}
                        <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
