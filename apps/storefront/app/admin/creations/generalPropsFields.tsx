import { Field } from '@couture-next/ui';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { ArticleFormType } from './form';

export default function GeneralPropsFields({
  register,
  errors,
}: {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
}) {
  return (
    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
      <p className="col-span-2 text-gray-500 text-xs text-center mb-4">
        Informations affichées sur la page de l&apos;article ainsi que dans les
        commandes
      </p>
      <Field
        label="Nom"
        widgetId="name"
        labelClassName="min-w-[min(30vw,15rem)]"
        error={errors.name?.message}
        renderWidget={(className) => (
          <input
            type="text"
            id="name"
            className={className}
            {...register('name')}
          />
        )}
      />
      <Field
        label="Description"
        widgetId="description"
        error={errors.description?.message}
        renderWidget={(className) => (
          <textarea
            id="description"
            className={className}
            {...register('description')}
          />
        )}
      />
    </fieldset>
  );
}
