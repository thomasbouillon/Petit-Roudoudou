'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import useBlockBodyScroll from '../../hooks/useBlockBodyScroll';
import React, { Fragment, PropsWithChildren, useState } from 'react';
import clsx from 'clsx';

export default function Filters() {
  const [expanded, setExpanded] = useState(false);
  const setBodyScrollBlocked = useBlockBodyScroll();

  return (
    <>
      <button
        className="btn-secondary"
        aria-controls="filters-dialog"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(true);
          setBodyScrollBlocked(true);
        }}
      >
        Filtrer les créations
      </button>
      <Transition show={expanded}>
        <Dialog
          onClose={() => {
            setExpanded(false);
            setBodyScrollBlocked(true);
          }}
          className="relative z-50"
        >
          <FiltersTransitionChild>
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </FiltersTransitionChild>
          <div
            className={clsx(
              'fixed left-0 top-[3.5rem] h-[calc(100dvh-3.5rem)] w-screen',
              'md:flex md:items-center md:justify-center md:p-4'
            )}
          >
            <FiltersTransitionChild>
              <Dialog.Panel className="relative flex flex-col mx-auto h-full p-4 md:h-auto md:max-w-lg md:rounded bg-white">
                <Dialog.Title
                  as="h2"
                  className="text-3xl font-serif text-center mb-8"
                >
                  Filtres
                </Dialog.Title>

                <div className="grow flex flex-col w-full">
                  <button
                    type="button"
                    className="absolute top-4 right-4"
                    onClick={() => {
                      setExpanded(false);
                      setBodyScrollBlocked(false);
                    }}
                    aria-controls="filters-dialog"
                    aria-expanded={expanded}
                  >
                    <span className="sr-only">Fermer le panier</span>
                    <XMarkIcon className="w-8 h-8" aria-hidden />
                  </button>
                  <div className="flex flex-col justify-between items-center flex-grow relative overflow-y-scroll">
                    <div className="space-y-4 md:min-h-[5rem]">TODO</div>
                  </div>
                  <div className="pt-4">
                    <p className="text-center"># résultats</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <button className="btn-secondary">
                        Effacer les filtres
                      </button>
                      <button className="btn-primary">Appliquer</button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </FiltersTransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

const FiltersTransitionChild: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <Transition.Child
      enter="transition-transform md:transition-opacity md:translate-x-0"
      enterFrom="translate-x-full md:opacity-0"
      enterTo="translate-x-0 md:opacity-100"
      leave="transition-transform md:transition-opacity md:translate-x-0"
      leaveFrom="translate-x-0 md:opacity-100"
      leaveTo="translate-x-full md:opacity-0"
      as={Fragment}
    >
      {children}
    </Transition.Child>
  );
};
