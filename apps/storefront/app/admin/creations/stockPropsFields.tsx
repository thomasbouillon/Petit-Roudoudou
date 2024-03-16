import { Field, ImagesField } from '@couture-next/ui';
import { useFieldArray, Control, UseFormWatch, FieldErrors, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { ArticleFormType } from './form';
import { useCallback, useMemo } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import clsx from 'clsx';
import { Sku } from '@couture-next/types';
import { v4 as uuid } from 'uuid';
import { routes } from '@couture-next/routing';
import { createSlugFromTitle } from './utils';
import useStorage from 'apps/storefront/hooks/useStorage';

type Props = {
  errors: FieldErrors<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  control: Control<ArticleFormType>;
  getValues: UseFormGetValues<ArticleFormType>;
  getUid?: (stockIndex?: string) => string;
};

function getSkuLabel(sku: Sku, characteristics: ArticleFormType['characteristics']) {
  const skuDesc = Object.entries(sku?.characteristics)
    .map(([characId, valueId]) => characteristics[characId].values[valueId])
    .join(' - ');
  return skuDesc ?? '(Default)';
}

function getUrlPreview(articleName: string, stockName: string) {
  return routes().shop().article(createSlugFromTitle(articleName)).showInStock(createSlugFromTitle(stockName));
}

export default function StockPropsFields({ control, watch, errors, setValue, getValues, getUid }: Props) {
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
      images: [],
      sku: '',
      stock: 1,
      inherits: {
        customizables: {},
      },
      seo: {
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
      {stocks.map((stock, i) => (
        <fieldset key={stock.id} className="border p-4 relative">
          <h2 className="font-bold text-xl min-h-[1.5em]">{watch(`stocks.${i}.title`)}</h2>
          <div className="mb-4">
            <small className="block">{getUrlPreview(watch('namePlural'), watch(`stocks.${i}.title`))}</small>
            {!!getUid && (
              <p className="text-gray-500 text-xs space-x-2">
                <span className="inline-block">Identifiant: </span>
                <pre className="inline-block font-bold">{getUid('' + i)}</pre>
              </p>
            )}
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
              label="Description"
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
              label="Description courte (SEO)"
              widgetId={`stocks.${i}.seo.description`}
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
                watch('customizables').filter((customizable) => customizable.type !== 'customizable-part').length ===
                0 ? (
                  <small className={clsx(className, 'block h-full')}>
                    Commence par les définir dans l'onglet 'Options'
                  </small>
                ) : (
                  <select
                    id={`stocks.${i}.inherits.customizables`}
                    className={className}
                    multiple={true}
                    value={Object.keys(watch(`stocks.${i}.inherits.customizables`))}
                    onChange={(e) => {
                      const selected = Array.from(e.currentTarget.selectedOptions).reduce((acc, option) => {
                        acc[option.value] = true;
                        return acc;
                      }, {} as Record<string, true>);
                      setValue(`stocks.${i}.inherits.customizables`, selected, { shouldDirty: true });
                    }}
                  >
                    {watch('customizables')
                      .filter((customizable) => customizable.type !== 'customizable-part')
                      .map((customizable, i) => (
                        <option key={i} value={customizable.uid}>
                          {customizable.label}
                        </option>
                      ))}
                  </select>
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
                    ui={{
                      addFileButtonClassName: 'btn-light mx-auto',
                      fileSize: { width: 64, height: 64 },
                    }}
                  />
                </div>
              )}
            />
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn-light mx-auto mt-6" onClick={handleAddStock}>
        Ajouter un article au stock
      </button>
    </div>
  );
}
