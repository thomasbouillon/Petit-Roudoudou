import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Disclosure } from '@headlessui/react';
import { RadioGroup } from '@headlessui/react';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Field } from '@couture-next/ui';
import { SubmitButton, schema, ArticleFormType } from './form';

export function StockForm({
  stock,
  setStock,
  filteredStocks,
  isPending,
}: {
  stock: string;
  setStock: (stock: string) => void;
  filteredStocks: any[];
  isPending: boolean;
}) {
  const {
    register: register,
    setValue: setStockValue,
    handleSubmit: handleSubmit,
    formState: { isDirty: isDirty },
  } = useForm<ArticleFormType>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const selectedStock = filteredStocks.find((s) => s.uid === stock);
    if (selectedStock) {
      setStockValue('seo.title', selectedStock.seo.title || '');
      setStockValue('seo.description', selectedStock.seo.description || '');
    }
  }, [stock, filteredStocks, setStockValue]);

  const onSubmit = (data: ArticleFormType) => {
    console.log('Stock Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                        <div className={checked ? 'outline-4 outline-red-600 outline relative' : 'relative'}>
                          <Image
                            src={stock.images[0].url}
                            alt={stock.title}
                            className="w-full aspect-square object-cover"
                            loader={loader}
                            width={544 / 2}
                            height={544 / 2}
                          />
                          {(stock && stock.seo.title.length > 60 && (
                            <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
                          )) ||
                            (stock && stock.seo.description.length < 110 && (
                              <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
                            )) ||
                            (stock && stock.seo.description.length > 160 && (
                              <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
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
                    widgetId="seo.title"
                    renderWidget={(className) => (
                      <input type="text" id="seo.title" className={className} {...register('seo.title')} />
                    )}
                  />
                  <Field
                    label="Description"
                    widgetId="seo.description"
                    helpText="Environ 160 caractères"
                    renderWidget={(className) => (
                      <textarea id="seo.description" className={className} {...register('seo.description')} />
                    )}
                  />
                </fieldset>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <div className="flex justify-end px-4 py-4">
        <SubmitButton isDirty={isDirty} isPending={isPending} />
      </div>
    </form>
  );
}
