import { Field, ImagesField } from '@couture-next/ui';
import {
  useFieldArray,
  Control,
  UseFormWatch,
  FieldErrors,
  UseFormSetValue,
  UseFormGetValues,
  Controller,
} from 'react-hook-form';
import { ArticleFormType } from './form';
import { useCallback, useMemo } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';
import { routes } from '@couture-next/routing';
import { createSlugFromTitle } from './utils';
import useStorage from 'apps/storefront/hooks/useStorage';
import { Listbox } from '@headlessui/react';

type Props = {
  errors: FieldErrors<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  control: Control<ArticleFormType>;
  getValues: UseFormGetValues<ArticleFormType>;
};

function getSkuLabel(sku: ArticleFormType['skus'][number], characteristics: ArticleFormType['characteristics']) {
  const skuDesc = Object.entries(sku?.characteristics)
    .map(([characId, valueId]) => characteristics[characId].values[valueId])
    .join(' - ');
  return skuDesc ?? '(Default)';
}

function getUrlPreview(articleName: string, stockName: string) {
  return routes().shop().article(createSlugFromTitle(articleName)).showInStock(createSlugFromTitle(stockName));
}

export default function StockPropsFields({ control, watch, errors }: Props) {
  const { handleUpload } = useStorage();

  const {
    fields: stocks,
    append: addStock,
    remove: removeStock,
  } = useFieldArray({
    name: 'stocks',
    control,
  });

  const handleAddStock = useCallback(() => {
    addStock({
      uid: uuid(),
      title: '',
      description: '',
      shortDescription: '',
      images: [],
      sku: '',
      stock: 1,
      inherits: {
        customizables: {},
      },
      seo: {
        title: '',
        description: '',
      },
    });
  }, [addStock]);

  const detailedSkus = useMemo(
    () =>
      watch('skus').map((sku) => ({
        label: getSkuLabel(sku, watch('characteristics')),
        uid: sku.uid,
      })),
    [watch]
  );

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs text-center mb-4">
        Saisi ici tous les stocks que tu as cousu pour cet article. Ils apparaîtront dans boutique.
      </p>
      <p className="text-gray-500 text-xs text-center mb-4">Le prix est définit par le SKU.</p>
      <button type="button" className="btn-light mx-auto mb-6" onClick={handleAddStock}>
        Ajouter un article au stock
      </button>
      {stocks.map((stock, i) => (
        <fieldset key={stock.id} className="border p-4 relative">
          <h2 className="font-bold text-xl min-h-[1.5em]">{watch(`stocks.${i}.title`)}</h2>
          <div className="mb-4">
            <small className="block">{getUrlPreview(watch('namePlural'), watch(`stocks.${i}.title`))}</small>
          </div>
          <button type="button" className="text-red-500 absolute top-4 right-4" onClick={() => removeStock(i)}>
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Titre"
              widgetId={`stocks.${i}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={errors.stocks?.[i]?.title?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`stocks.${i}.label`}
                  className={className}
                  {...control.register(`stocks.${i}.title`)}
                />
              )}
            />
            <Field
              label="Description Complète"
              widgetId={`stocks.${i}.description`}
              error={errors.stocks?.[i]?.description?.message}
              renderWidget={(className) => (
                <textarea
                  id={`stocks.${i}.description`}
                  className={className}
                  rows={4}
                  {...control.register(`stocks.${i}.description`)}
                />
              )}
            />
            <Field
              label="Description courte"
              widgetId={`stocks.${i}.shortDescription`}
              error={errors.stocks?.[i]?.seo?.description?.message}
              helpText="Description courte pour les cartes"
              renderWidget={(className) => (
                <textarea
                  id={`stocks.${i}.shortDescription`}
                  className={className}
                  {...control.register(`stocks.${i}.shortDescription`)}
                  rows={2}
                />
              )}
            />
            <Field
              label="Titre de la page (SEO)"
              widgetId={`stocks.${i}.seo.description`}
              helpText="Titre de la page pour le référencement, insiste sur les mots clefs"
              error={errors.stocks?.[i]?.seo?.title?.message}
              renderWidget={(className) => (
                <textarea
                  id={`stocks.${i}.seo.title`}
                  className={className}
                  {...control.register(`stocks.${i}.seo.title`)}
                  rows={2}
                />
              )}
            />
            <Field
              label="Description courte (SEO)"
              widgetId={`stocks.${i}.seo.description`}
              helpText="Description courte pour le référencement, insiste sur les mots clefs"
              error={errors.stocks?.[i]?.seo?.description?.message}
              renderWidget={(className) => (
                <textarea
                  id={`stocks.${i}.seo.description`}
                  className={className}
                  {...control.register(`stocks.${i}.seo.description`)}
                  rows={2}
                />
              )}
            />
            <Field
              label="SKU"
              widgetId={`stocks.${i}.sku`}
              error={errors.stocks?.[i]?.sku?.message}
              renderWidget={(className) => (
                <select id={`stocks.${i}.sku`} className={className} {...control.register(`stocks.${i}.sku`)}>
                  <option value=""></option>
                  {detailedSkus.map((sku, i) => (
                    <option key={i} value={sku.uid}>
                      {sku.label || 'Défaut'}
                    </option>
                  ))}
                </select>
              )}
            />
            <Field
              label="Quantité en stock"
              widgetId={`stocks.${i}.stock`}
              error={errors.stocks?.[i]?.stock?.message}
              renderWidget={(className) => (
                <input
                  type="number"
                  id={`stocks.${i}.stock`}
                  className={className}
                  step={1}
                  min={0}
                  {...control.register(`stocks.${i}.stock`, { valueAsNumber: true })}
                />
              )}
            />
            <Field
              label="Options"
              widgetId={`stocks.${i}.inherits.customizables`}
              helpText="CTRL+click pour sélectionner plusieurs options"
              renderWidget={(className) =>
                watch('customizables').length === 0 ? (
                  <small className={clsx(className, 'block h-full')}>
                    Commence par les définir dans l'onglet 'Options'
                  </small>
                ) : (
                  <Controller
                    control={control}
                    name={`stocks.${i}.inherits.customizables`}
                    render={({ field }) => (
                      <Listbox
                        multiple
                        value={Object.keys(field.value)}
                        onChange={(value) => {
                          const r = value.reduce((acc, val) => ({ ...acc, [val]: true }), {});
                          field.onChange(r);
                        }}
                      >
                        <Listbox.Options static as="ul" className={className}>
                          {watch('customizables')
                            .filter((customizable) => customizable.type !== 'customizable-piping')
                            .map((customizable, i) => (
                              <Listbox.Option
                                key={i}
                                value={customizable.uid}
                                className="ui-not-selected:line-through ui-selected:no-underline !outline-none"
                              >
                                {customizable.label}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </Listbox>
                    )}
                  />
                )
              }
            />
            <Field
              label="Images"
              widgetId={`stocks.${i}.images`}
              error={errors.stocks?.[i]?.images?.message}
              renderWidget={(className) => (
                <div className={className}>
                  <ImagesField
                    formControlKey={`stocks.${i}.images`}
                    uploadFile={handleUpload}
                    imageLoader={loader}
                    multiple
                    ui={{
                      addFileButtonClassName: 'btn-light mx-auto',
                      fileSize: { width: 128, height: 128 },
                    }}
                  />
                </div>
              )}
            />
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn-light mx-auto mb-6" onClick={handleAddStock}>
        Ajouter un article au stock
      </button>
    </div>
  );
}
