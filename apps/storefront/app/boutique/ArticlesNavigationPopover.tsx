'use client';

import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import { Popover, Transition, Disclosure } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
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
        <Popover.Panel className="absolute z-20 left-1/2 -translate-x-1/2 translate-y-4 w-full sm:w-1/4  max-w-prose p-4">
          {({ close }) => (
            <div className="relative bg-white  border rounded shadow-md">
              <div className="grid grid-cols-[1fr_auto] gap-2 p-6 border-b border-black">
                <h2 className="text-lg underline">Trier</h2>
                <button type="button" onClick={() => close()} aria-label="Fermer la popup">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <nav aria-label="Navigation parmis les articles" className=" overflow-hidden">
                <Disclosure>
                  <Disclosure.Button className="border-b border-black p-4 w-full z-10 grid grid-cols-[1fr_auto] !outline-none ">
                    <span className="empty:block ">Catégorie d'article</span>
                    <span>
                      <ChevronRightIcon className="w-6 h-6 ml-4 ui-not-open:transform-none ui-open:rotate-90 ui-open:transform"></ChevronRightIcon>
                    </span>
                  </Disclosure.Button>

                  <Transition
                    className="relative transition-transform ease-out"
                    enterFrom="-translate-y-1/4"
                    enterTo="translate-y-0"
                    leaveFrom="translate-y-0"
                    leaveTo="-translate-y-1/4"
                  >
                    <>
                      <Disclosure.Panel className="flex flex-col gap-4 !outline-none max-w-prose mx-auto">
                        <ul className="empty:hidden flex flex-col p-4 ui-not-open:border-0 border-b gap-2 border-black">
                          {articles.map((article) => (
                            <li className="relative !outline-none" key={article.id}>
                              <label className="space-y-2 grid grid-cols-[1fr_auto]">
                                {article.namePlural}
                                <input className="ml-4" type="checkbox" />
                              </label>
                            </li>
                          ))}
                        </ul>
                      </Disclosure.Panel>
                    </>
                  </Transition>
                </Disclosure>
              </nav>
              <div className="py-6">
                <button className="btn-secondary mx-auto">Afficher le résultat</button>
              </div>
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
