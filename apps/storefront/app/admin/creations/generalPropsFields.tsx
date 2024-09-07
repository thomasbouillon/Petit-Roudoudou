import { Field } from '@couture-next/ui/form/Field';
import { FormProvider, useFormContext } from 'react-hook-form';
import { ArticleFormType } from './form';
import clsx from 'clsx';
import { routes } from '@couture-next/routing';
import { createSlugFromTitle } from './utils';
import SelectArticleThemeWidget from './selectArticleThemeWidget';

function getUrlPreview(articleName: string) {
  return routes().shop().article(createSlugFromTitle(articleName)).index();
}

export default function GeneralPropsFields() {
  const form = useFormContext<ArticleFormType>();
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  return (
    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
      <div className="col-span-2 mb-4 space-y-2">
        <p className="text-gray-500 text-xs text-center">
          Informations affichées sur la page de l&apos;article ainsi que dans les commandes
        </p>
      </div>

      <Field
        label="Nom"
        widgetId="name"
        labelClassName="min-w-[min(30vw,15rem)]"
        error={errors.name?.message}
        renderWidget={(className) => <input type="text" id="name" className={className} {...register('name')} />}
      />
      <Field
        label="Nom"
        widgetId="namePlural"
        labelClassName="min-w-[min(30vw,15rem)]"
        helpText="(pluriel)"
        error={errors.namePlural?.message}
        renderWidget={(className) => (
          <>
            <input
              type="text"
              id="namePlural"
              className={className}
              list="namePluralList"
              {...register('namePlural')}
            />
            <datalist id="namePluralList">
              <option value={watch('name') + 's'} />
            </datalist>
          </>
        )}
      />
      <Field
        label="Lien dans la boutique"
        widgetId="shopLink"
        labelClassName="min-w-[min(30vw,15rem)]"
        renderWidget={(className) => (
          <input
            type="text"
            id="shopLink"
            disabled
            className={clsx(className, 'opacity-50 cursor-not-allowed')}
            value={getUrlPreview(watch('namePlural'))}
          />
        )}
      />
      <Field
        label="Description courte"
        widgetId="shortDescription"
        error={errors.description?.message}
        helpText="Courte description utilisé pour les cartes"
        renderWidget={(className) => (
          <textarea id="shortDescription" rows={3} className={className} {...register('shortDescription')} />
        )}
      />
      <Field
        label="Description"
        widgetId="description"
        error={errors.description?.message}
        renderWidget={(className) => (
          <textarea id="description" rows={5} className={className} {...register('description')} />
        )}
      />
      <Field
        label="Thème"
        widgetId="theme"
        helpText="Eveil, Chambre, ..."
        error={errors.themeId?.message}
        renderWidget={(className) => (
          <FormProvider {...form}>
            <SelectArticleThemeWidget className={className} />
          </FormProvider>
        )}
      />
      <Field
        label="Quantité minimum"
        widgetId="minQuantity"
        error={errors.minQuantity?.message}
        renderWidget={(className) => (
          <input
            type="number"
            id="minQuantity"
            className={className}
            min={1}
            {...register('minQuantity', { valueAsNumber: true })}
          />
        )}
      />
    </fieldset>
  );
}
