import { UseFormSetValue } from 'react-hook-form';
import { Field } from '@couture-next/ui';
import { Article, Sku } from '@couture-next/types';
import { AddToCartFormType } from './page';
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

type Props = {
  article: Article;
  value: AddToCartFormType['skuId'];
  setValue: UseFormSetValue<AddToCartFormType>;
};

export default function FormSkuField({ article, value, setValue }: Props) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  // force selection to value
  useEffect(() => {
    if (value) {
      const sku = article.skus.find((sku) => sku.uid === value);
      if (sku) {
        setSelection(sku.characteristics);
      }
    }
  }, [article.skus, value, setSelection]);

  const selectSku = useCallback(
    (sku: Sku | undefined) => {
      if (sku) {
        setValue('skuId', sku.uid, { shouldValidate: true });
      } else {
        setValue('skuId', '', { shouldValidate: true });
      }
    },
    [setValue]
  );

  // if only one sku, select it
  useEffect(() => {
    if (article.skus.length === 1) {
      selectSku(article.skus[0]);
      setSelection(article.skus[0].characteristics);
    }
  }, [article.skus, setSelection, selectSku]);

  const select = useCallback(
    (characteristicId: string, valueId: string) => {
      setSelection((selection) => {
        const nextSelection = {
          ...selection,
          [characteristicId]: valueId,
        };

        const sku = article.skus.find((sku) =>
          Object.entries(sku.characteristics).every(
            ([characteristicId, characteristicValueId]) => nextSelection[characteristicId] === characteristicValueId
          )
        );

        selectSku(sku);

        return nextSelection;
      });
    },
    [article.skus, setSelection, selectSku]
  );

  return (
    <>
      <div>
        <div className="grid gap-4">
          {Object.entries(article.characteristics).map(([characteristicId, characteristic]) => (
            <div key={characteristicId}>
              <Field
                label={characteristic.label}
                labelClassName="!items-start"
                widgetId={characteristicId}
                renderWidget={(className) => (
                  <select
                    key={characteristicId}
                    className={className}
                    onChange={(e) => select(characteristicId, e.target.value)}
                    value={selection[characteristicId]}
                    id={characteristicId}
                  >
                    <option value="">Choisissez une option</option>
                    {Object.entries(characteristic.values).map(([valueId, valueLabel]) => (
                      <option key={valueId} value={valueId}>
                        {valueLabel}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
