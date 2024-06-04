'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { Field } from '@couture-next/ui';
import { Disclosure } from '@headlessui/react';
import { RadioGroup } from '@headlessui/react';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircleIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@couture-next/ui';

//----------------------------------------------------------------------
const categorySchema = z.object({
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
  }),
});

const stockSchema = z.object({
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
  }),
});

const customizationSchema = z.object({
  seo: z.object({
    title: z.string().min(3, 'Le nom doit faire au moins 3 caractères'),
    description: z.string().min(3, 'La description doit faire au moins 3 caractères'),
  }),
});

export type CategoryFormType = z.infer<typeof categorySchema>;
export type StockFormType = z.infer<typeof stockSchema>;
export type CustomizationFormType = z.infer<typeof customizationSchema>;

//----------------------------------------------------------------------

export function Form({ stockUidBlacklist, isPending }: { stockUidBlacklist?: string[]; isPending?: boolean }) {
  const { data: articles, error } = trpc.articles.list.useQuery();

  const {
    register: categoryRegister,
    setValue: setCategoryValue,
    handleSubmit: handleCategorySubmit,
    formState: { isDirty: isCategoryDirty },
  } = useForm<CategoryFormType>({
    resolver: zodResolver(categorySchema),
  });

  const {
    register: stockRegister,
    setValue: setStockValue,
    handleSubmit: handleStockSubmit,
    formState: { isDirty: isStockDirty },
  } = useForm<StockFormType>({
    resolver: zodResolver(stockSchema),
  });

  const {
    register: customRegister,
    handleSubmit: handleCustomSubmit,
    formState: { isDirty: isCustomDirty },
  } = useForm<CustomizationFormType>({
    resolver: zodResolver(customizationSchema),
  });

  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  useEffect(() => {
    setStock('');
  }, [category]);

  const selectedArticle = useMemo(() => articles?.find((article) => article.id === category), [articles, category]);
  const selectedStock = useMemo(() => selectedArticle?.stocks.find((s) => s.uid === stock), [selectedArticle, stock]);
  const filteredStocks = useMemo(
    () =>
      selectedArticle
        ? stockUidBlacklist
          ? selectedArticle.stocks.filter((stock) => !stockUidBlacklist.includes(stock.uid))
          : selectedArticle.stocks
        : [],
    [selectedArticle, stockUidBlacklist]
  );

  useEffect(() => {
    if (selectedArticle) {
      setCategoryValue('seo.title', selectedArticle.seo.title || '');
      setCategoryValue('seo.description', selectedArticle.seo.description || '');
    }
  }, [selectedArticle, setCategoryValue]);

  useEffect(() => {
    if (selectedStock) {
      setStockValue('seo.title', selectedStock.seo.title || '');
      setStockValue('seo.description', selectedStock.seo.description || '');
    }
  }, [selectedStock, setStockValue]);

  if (articles === undefined) return <div>Loading...</div>;

  const onSubmitCategory = (data: CategoryFormType) => {
    console.log('Category Data:', data);
  };

  const onSubmitStock = (data: StockFormType) => {
    console.log('Stock Data:', data);
  };

  const onSubmitCustomization = (data: CustomizationFormType) => {
    console.log('Customization Data:', data);
  };

  const SubmitButton = (
    <button
      type="submit"
      disabled={(!isCategoryDirty && !isStockDirty && !isCustomDirty) || isPending}
      className={clsx(
        'ml-auto mr-2 pl-2',
        (isCategoryDirty || isStockDirty || isCustomDirty) && !isPending && 'animate-bounce',
        !(isCategoryDirty || isStockDirty || isCustomDirty) && 'opacity-20 cursor-not-allowed'
      )}
    >
      {!isPending && <CheckCircleIcon className="h-6 w-6 text-primary-100" />}
      {isPending && <Spinner className="w-6 h-6 text-primary-100" />}
    </button>
  );

  if (error) throw error;

  return (
    <div className="max-w-3xl mx-auto my-8 shadow-sm bg-white rounded-md px-4 border">
      <form onSubmit={handleCategorySubmit(onSubmitCategory)}>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="text-2xl p-4 py-6 font-bold w-full text-start">
                <span className="flex">
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
                          <div className={checked ? 'outline-4  outline-red-600 outline relative' : 'relative'}>
                            <Image
                              src={article.images[0].url}
                              alt={article.namePlural}
                              className="w-full aspect-square object-cover"
                              loader={loader}
                              width={544 / 2}
                              height={544 / 2}
                            />
                            {(article && article.seo.title.length > 60 && (
                              <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                            )) ||
                              (article && article.seo.description.length < 110 && (
                                <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                              )) ||
                              (article && article.seo.description.length > 160 && (
                                <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                              ))}
                          </div>
                          <span className="">{article.name}</span>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </RadioGroup>
                {category && category.length > 0 && (
                  <>
                    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
                      <p className="col-span-2 text-gray-500 text-xs text-center">
                        Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des pages
                      </p>
                      <Field
                        labelClassName="min-w-[min(30vw,15rem)]"
                        label="Titre de la page"
                        widgetId="seo.title"
                        renderWidget={(className) => (
                          <input type="text" id="seo.title" className={className} {...categoryRegister('seo.title')} />
                        )}
                      />
                      <Field
                        label="Description"
                        widgetId="seo.description"
                        helpText="Environ 160 caractères"
                        renderWidget={(className) => (
                          <>
                            <textarea
                              id="seo.description"
                              className={className}
                              {...categoryRegister('seo.description')}
                            />
                          </>
                        )}
                      />
                    </fieldset>
                  </>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        <div className="flex justify-end px-4 py-4">{SubmitButton}</div>
      </form>
      {category && category.length > 0 && (
        <>
          <form onSubmit={handleStockSubmit(onSubmitStock)}>
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="text-2xl p-4 py-6 font-bold w-full text-start">
                    <span className="flex">
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
                              <div className={checked ? 'outline-4  outline-red-600 outline relative' : 'relative'}>
                                <Image
                                  src={stock.images[0].url}
                                  alt={stock.title}
                                  className="w-full aspect-square object-cover"
                                  loader={loader}
                                  width={544 / 2}
                                  height={544 / 2}
                                />
                                {(stock && stock.seo.title.length > 60 && (
                                  <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                                )) ||
                                  (stock && stock.seo.description.length < 110 && (
                                    <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                                  )) ||
                                  (stock && stock.seo.description.length > 160 && (
                                    <ExclamationTriangleIcon className=" text-red-600 bg-white  h-8 w-8 absolute bottom-0 right-0" />
                                  ))}
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
                          Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des pages
                        </p>
                        <Field
                          labelClassName="min-w-[min(30vw,15rem)]"
                          label="Titre de la page"
                          widgetId="stockSeo.title"
                          renderWidget={(className) => (
                            <input
                              type="text"
                              id="stockSeo.title"
                              className={className}
                              {...stockRegister('seo.title')}
                            />
                          )}
                        />
                        <Field
                          label="Description"
                          widgetId="stockSeo.description"
                          helpText="Environ 160 caractères"
                          renderWidget={(className) => (
                            <>
                              <textarea
                                id="stockSeo.description"
                                className={className}
                                {...stockRegister('seo.description')}
                              />
                            </>
                          )}
                        />
                      </fieldset>
                    )}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            <div className="flex justify-end px-4 py-4 ">{SubmitButton}</div>
          </form>

          <form onSubmit={handleCustomSubmit(onSubmitCustomization)}>
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="text-2xl p-4 py-6 font-bold w-full text-start">
                    <span className="flex">
                      Personnaliser <ChevronRightIcon className={open ? 'rotate-90 transform max-w-8' : 'max-w-8'} />
                    </span>
                  </Disclosure.Button>
                  <Disclosure.Panel className="">
                    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
                      <p className="col-span-2 text-gray-500 text-xs text-center">
                        Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des pages
                      </p>
                      <Field
                        labelClassName="min-w-[min(30vw,15rem)]"
                        label="Titre de la page"
                        widgetId="customSeo.title"
                        renderWidget={(className) => (
                          <input
                            type="text"
                            id="customSeo.title"
                            className={className}
                            {...customRegister('seo.title')}
                          />
                        )}
                      />
                      <Field
                        label="Description"
                        widgetId="customSeo.description"
                        helpText="Environ 160 caractères"
                        renderWidget={(className) => (
                          <>
                            <textarea
                              id="customSeo.description"
                              className={className}
                              {...customRegister('seo.description')}
                            />
                          </>
                        )}
                      />
                    </fieldset>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            <div className="flex justify-end px-4 py-4 ">{SubmitButton}</div>
          </form>
        </>
      )}
    </div>
  );
}
