import { Field } from '@couture-next/ui';
import { ArticleFormType } from './form';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

export default function SeoPropsFields({
  register,
  errors,
}: {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
}) {
  return (
    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
      <p className="col-span-2 text-gray-500 text-xs text-center">
        Informations visibles dans le moteur de recherche Google et pour l&apos;indexation des pages
      </p>
      <p className="col-span-2 text-center mb-4">Cette partie concerne les articles sur mesure.</p>
      <Field
        labelClassName="min-w-[min(30vw,15rem)]"
        label="Titre de la page"
        widgetId="seo.title"
        error={errors.seo?.title?.message}
        renderWidget={(className) => (
          <input type="text" id="seo.name" className={className} {...register('seo.title')} />
        )}
      />
      <Field
        label="Description"
        widgetId="seo.description"
        helpText="Environ 250 caractères"
        error={errors.seo?.description?.message}
        renderWidget={(className) => (
          <textarea id="seo.description" className={className} {...register('seo.description')} />
        )}
      />
    </fieldset>
  );
}
