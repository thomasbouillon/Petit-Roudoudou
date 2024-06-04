import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Field } from '@couture-next/ui';
import { SubmitButton, schema, ArticleFormType } from './form';

export function CustomizationForm({ isPending }: { isPending: boolean }) {
  const {
    register: register,
    handleSubmit: handleSubmit,
    formState: { isDirty: isDirty },
  } = useForm<ArticleFormType>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ArticleFormType) => {
    console.log('Customization Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                    <input type="text" id="customSeo.title" className={className} {...register('seo.title')} />
                  )}
                />
                <Field
                  label="Description"
                  widgetId="customSeo.description"
                  helpText="Environ 160 caractères"
                  renderWidget={(className) => (
                    <textarea id="customSeo.description" className={className} {...register('seo.description')} />
                  )}
                />
              </fieldset>
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
