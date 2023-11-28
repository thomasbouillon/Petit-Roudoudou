'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import useBlockBodyScroll from '../../hooks/useBlockBodyScroll';
import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useState,
} from 'react';
import { collection, getDocs } from 'firebase/firestore';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../hooks/useDatabase';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { Article } from '@couture-next/types';
import { Spinner } from '@couture-next/ui';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

const schema = z.object({
  articleTypes: z.array(z.object({ _id: z.string() })),
});

type SchemaType = z.infer<typeof schema>;

export default function Filters() {
  const [expanded, setExpanded] = useState(false);
  const setBodyScrollBlocked = useBlockBodyScroll();
  const db = useDatabase();

  const { control, handleSubmit } = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'articleTypes',
  });

  const handleToggle = (id: string) => {
    const index = fields.findIndex((field) => field._id === id);
    if (index === -1) {
      append({ _id: id });
    } else {
      remove(index);
    }
  };

  const allArticlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: () =>
      getDocs(
        collection(db, 'articles').withConverter(
          firestoreConverterAddRemoveId<Article>()
        )
      ).then((snapshot) =>
        snapshot.docs.map((doc) => {
          const article = doc.data();
          return {
            _id: article._id,
            name: article.name,
          };
        })
      ),
  });
  if (allArticlesQuery.isError) throw allArticlesQuery.error;

  const close = useCallback(() => {
    setExpanded(false);
    setBodyScrollBlocked(false);
  }, [setExpanded, setBodyScrollBlocked]);

  const toggleExpanded = useCallback(() => {
    setExpanded((expanded) => {
      if (!expanded) setBodyScrollBlocked(true);
      return !expanded;
    });
  }, [setExpanded, setBodyScrollBlocked]);

  const router = useRouter();
  const onSubmit = handleSubmit((data) => {
    const query = new URLSearchParams();
    data.articleTypes.forEach((articleType) => {
      query.append('type', articleType._id);
    });
    const url = `${new URL(window.location.href).pathname}?${query.toString()}`;
    router.push(url);
    close();
  });

  return (
    <>
      <button
        className="btn-secondary"
        aria-controls="filters-dialog"
        aria-expanded={expanded}
        onClick={toggleExpanded}
      >
        Filtrer les créations
      </button>
      <Transition show={expanded}>
        <Dialog onClose={close} className="relative z-50">
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

                <form className="grow flex flex-col w-full" onSubmit={onSubmit}>
                  <button
                    type="button"
                    className="absolute top-4 right-4"
                    onClick={close}
                    aria-controls="filters-dialog"
                    aria-expanded={expanded}
                  >
                    <span className="sr-only">
                      Fermer le dialogue de filtres
                    </span>
                    <XMarkIcon className="w-8 h-8" aria-hidden />
                  </button>
                  <div className="flex flex-col justify-between items-center flex-grow relative overflow-y-scroll">
                    <div className="space-y-4 md:min-h-[5rem]">
                      <h3 className="text-center">Nature des créations</h3>
                      {!allArticlesQuery.isPending ? (
                        <div className="grid grid-cols-[auto,auto,auto] place-content-center">
                          {allArticlesQuery.data.map((article) => (
                            <label key={article._id}>
                              <input
                                value={article._id}
                                name="article-types"
                                type="checkbox"
                                multiple
                                className="mr-2"
                                checked={fields.some(
                                  (field) => field._id === article._id
                                )}
                                onChange={() => handleToggle(article._id)}
                              />
                              {article.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="sr-only">
                            Récupération des créations...
                          </p>
                          <Spinner />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-center"># résultats</p>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => alert('todo')}
                      >
                        Effacer les filtres
                      </button>
                      <button className="btn-primary" type="submit">
                        Appliquer
                      </button>
                    </div>
                  </div>
                </form>
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
