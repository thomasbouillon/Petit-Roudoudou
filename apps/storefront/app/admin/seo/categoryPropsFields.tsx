import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Disclosure } from '@headlessui/react';
import { RadioGroup } from '@headlessui/react';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Field } from '@couture-next/ui';
import { SubmitButton, ArticleFormType } from './form';
import { OnSubmitArticleFormCallback } from './form';

export function CategoryForm({
  category,
  setCategory,
  articles,
  isPending,
  onSubmitCallback,
}: {
  category: string;
  setCategory: (category: string) => void;
  articles: any[];
  isPending: boolean;
  onSubmitCallback: OnSubmitArticleFormCallback;
}) {
  const {
    register,
    setValue: setCategoryValue,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useFormContext<ArticleFormType>();

  useEffect(() => {
    const selectedArticle = articles.find((article) => article.id === category);
    if (selectedArticle) {
      setCategoryValue('seo.title', selectedArticle.seo.title || '');
      setCategoryValue('seo.description', selectedArticle.seo.description || '');
    }
  }, [category, articles, setCategoryValue]);

  const onSubmit = handleSubmit((data) => onSubmitCallback(data, reset));

  return (
    <form onSubmit={onSubmit}>
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
                        <div className={checked ? 'outline-4 outline-red-600 outline relative' : 'relative'}>
                          <Image
                            src={article.images[0].url}
                            alt={article.namePlural}
                            className="w-full aspect-square object-cover"
                            loader={loader}
                            width={544 / 2}
                            height={544 / 2}
                          />
                          {(article && article.seo.title.length > 60 && (
                            <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
                          )) ||
                            (article && article.seo.description.length < 110 && (
                              <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
                            )) ||
                            (article && article.seo.description.length > 160 && (
                              <ExclamationTriangleIcon className="text-red-600 bg-white h-8 w-8 absolute bottom-0 right-0" />
                            ))}
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
