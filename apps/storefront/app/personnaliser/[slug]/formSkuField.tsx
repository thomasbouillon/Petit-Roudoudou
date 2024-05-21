import { useController } from 'react-hook-form';
import { Field } from '@couture-next/ui';
import { Article, Sku } from '@couture-next/types';
import { AddToCartFormType } from './app';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Props = {
  article: Article;
};

export default function FormSkuField({ article }: Props) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const { field } = useController<AddToCartFormType, 'skuId'>({ name: 'skuId' });
  const searchParams = useSearchParams();
  const selectedVariantUid = searchParams.get('variant');
  const allowedSkus = article.skus.filter((sku) => sku.customizableVariantUid === selectedVariantUid);

  // force selection to value
  useEffect(() => {
    if (field.value) {
      const sku = allowedSkus.find((sku) => sku.uid === field.value);
      if (sku) {
        setSelection(sku.characteristics);
      }
    }
  }, [allowedSkus, field.value, setSelection]);

  const selectSku = useCallback(
    (sku: Sku | undefined) => {
      if (sku) {
        console.log('Calling set value');
        field.onChange(sku.uid);
      } else {
        field.onChange('');
      }
    },
    [field.onChange]
  );

  // if only one sku, select it
  useEffect(() => {
    if (allowedSkus.length === 1) {
      setTimeout(() => {
        selectSku(allowedSkus[0]);
        setSelection(allowedSkus[0].characteristics);
      }, 0);
    }
  }, [allowedSkus, setSelection, selectSku]);

  const select = useCallback(
    (characteristicId: string, valueId: string) => {
      setSelection((selection) => {
        const nextSelection = {
          ...selection,
          [characteristicId]: valueId,
        };

        const sku = allowedSkus.find((sku) =>
          Object.entries(sku.characteristics).every(
            ([characteristicId, characteristicValueId]) => nextSelection[characteristicId] === characteristicValueId
          )
        );

        selectSku(sku);

        return nextSelection;
      });
    },
    [allowedSkus, setSelection, selectSku]
  );

  return (
    <>
      <div>
        <div className="grid gap-4" ref={field.ref} onBlur={field.onBlur}>
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
                    <option value="">Choisis une option</option>
                    {Object.entries(characteristic.values)
                      .filter(([valueId]) =>
                        allowedSkus.some((sku) => sku.characteristics[characteristicId] === valueId)
                      )
                      .map(([valueId, valueLabel]) => (
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
