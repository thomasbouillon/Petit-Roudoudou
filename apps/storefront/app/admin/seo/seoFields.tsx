'use client';

import { trpc } from 'apps/storefront/trpc-client';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { Field } from '@couture-next/ui';
import { Disclosure } from '@headlessui/react';
import { RadioGroup } from '@headlessui/react';
import { useState, useMemo } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

//----------------------------------------------------------------------

//----------------------------------------------------------------------

export function Form({ stockUidBlacklist }: { stockUidBlacklist?: string[] }) {
  const { data: articles, error } = trpc.articles.list.useQuery();

  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  if (articles === undefined) return <div>Loading...</div>;

  const selectedArticle = useMemo(() => articles.find((article) => article.id === category), [articles, category]);
  const filteredStocks = useMemo(
    () =>
      selectedArticle
        ? stockUidBlacklist
          ? selectedArticle.stocks.filter((stock) => !stockUidBlacklist.includes(stock.uid))
          : selectedArticle.stocks
        : [],
    [selectedArticle, stockUidBlacklist]
  );

  if (error) throw error;
  const SubmitButton = <button type="submit"></button>;

  return (
    <form className="max-w-3xl mx-auto mt-8 shadow-sm bg-white rounded-md px-4 border">
      <div>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="text-2xl p-4 py-6 font-bold w-full text-start">
                <span className="flex">
                  {' '}
                  Catégories <ChevronRightIcon className={open ? 'rotate-90 transform max-w-8' : 'max-w-8'} />
                </span>
              </Disclosure.Button>
              <Disclosure.Panel className="">
                <RadioGroup
                  value={category}
                  onChange={setCategory}
                  className="w-11/12 mx-auto mt-2 grid grid-cols-4 gap-4 text-center"
                >
                  {articles.map((article) => (
                    <RadioGroup.Option key={article.id} value={article.id}>
                      {({ checked }) => (
                        <>
                          <div className={checked ? 'outline-4  outline-red-600 outline' : ''}>
                            <Image
                              src={article.images[0].url}
                              alt={article.namePlural}
                              className="w-full aspect-square object-cover"
                              loader={loader}
                              width={544 / 2}
                              height={544 / 2}
                            />
                          </div>
                          <span className="">{article.name}</span>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </RadioGroup>
                {category && category.length > 0 && (
                  <fieldset className="grid grid-cols-[auto_1fr] gap-4">
                    <p className="col-span-2 text-gray-500 text-xs text-center">
                      Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des pages
                    </p>
                    <Field
                      labelClassName="min-w-[min(30vw,15rem)]"
                      label="Titre de la page"
                      widgetId="seo.title"
                      renderWidget={(className) => <input type="text" id="seo.title" className={className} />}
                    />
                    <Field
                      label="Description"
                      widgetId="seo.description"
                      helpText="Environ 160 caractères"
                      renderWidget={(className) => (
                        <>
                          <textarea id="seo.description" className={className} />
                        </>
                      )}
                    />
                  </fieldset>
                )}
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="text-2xl p-4 py-6 font-bold w-full text-start">
                        <span className="flex">
                          {' '}
                          Stock <ChevronRightIcon className={open ? 'rotate-90 transform max-w-8' : 'max-w-8'} />
                        </span>
                      </Disclosure.Button>
                      <Disclosure.Panel className="">
                        <RadioGroup
                          value={stock}
                          onChange={setStock}
                          className="w-11/12 mx-auto mt-2 grid grid-cols-4 gap-4 text-center"
                        >
                          {filteredStocks.map((stock) => (
                            <RadioGroup.Option key={stock.uid} value={stock.uid}>
                              {({ checked }) => (
                                <>
                                  <div className={checked ? 'outline-4  outline-red-600 outline' : ''}>
                                    <Image
                                      src={stock.images[0].url}
                                      alt={stock.title}
                                      className="w-full aspect-square object-cover"
                                      loader={loader}
                                      width={544 / 2}
                                      height={544 / 2}
                                    />
                                  </div>
                                  <span className="">{stock.title}</span>
                                </>
                              )}
                            </RadioGroup.Option>
                          ))}
                        </RadioGroup>
                        {stock && stock.length > 0 && (
                          <fieldset className="grid grid-cols-[auto_1fr] gap-4">
                            <p className="col-span-2 text-gray-500 text-xs text-center">
                              Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des
                              pages
                            </p>
                            <Field
                              labelClassName="min-w-[min(30vw,15rem)]"
                              label="Titre de la page"
                              widgetId="seo.title"
                              renderWidget={(className) => <input type="text" id="seo.title" className={className} />}
                            />
                            <Field
                              label="Description"
                              widgetId="seo.description"
                              helpText="Environ 160 caractères"
                              renderWidget={(className) => (
                                <>
                                  <textarea id="seo.description" className={className} />
                                </>
                              )}
                            />
                          </fieldset>
                        )}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>

      <div className="">{SubmitButton}</div>
    </form>
  );
}
