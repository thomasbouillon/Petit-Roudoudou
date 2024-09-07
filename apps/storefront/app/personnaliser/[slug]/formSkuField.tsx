import { useController } from 'react-hook-form';
import { Field } from '@couture-next/ui/form/Field';
import { Article, Sku } from '@couture-next/types';
import { AddToCartFormType } from './app';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Props = {
  article: Article;
};

export default function FormSkuField({ article }: Props) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const { field, fieldState } = useController<AddToCartFormType, 'skuId'>({ name: 'skuId' });
  const searchParams = useSearchParams();
  const selectedVariantUid = searchParams.get('variant');
  const allowedSkus = useMemo(
    () => article.skus.filter((sku) => sku.customizableVariantUid === selectedVariantUid),
    [article.skus, selectedVariantUid]
  );

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
              <ChooseCharacteristicField
                value={selection[characteristicId]}
                onChange={(value) => select(characteristicId, value)}
                allowedSkus={allowedSkus}
                characteristicId={characteristicId}
                characteristic={characteristic}
              />
            </div>
          ))}
        </div>
        {fieldState.invalid && (
          <p className="text-sm text-red-500">Assure toi d'avoir bien remplis les champs ci-dessus</p>
        )}
      </div>
    </>
  );
}

type ChooseCharacteristicFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  allowedSkus: Sku[];
  characteristicId: string;
  characteristic: Article['characteristics'][string];
};

function ChooseCharacteristicField({
  value,
  onChange,
  allowedSkus,
  characteristic,
  characteristicId,
}: ChooseCharacteristicFieldProps) {
  const allowedValues = useMemo(
    () =>
      Object.entries(characteristic.values)
        .filter(([valueId]) => allowedSkus.some((sku) => sku.characteristics[characteristicId] === valueId))
        .map(([valueId, valueLabel]) => ({
          id: valueId,
          label: valueLabel,
        })),
    [allowedSkus, characteristic.values]
  );

  useEffect(() => {
    if (!value && allowedValues.length === 1) {
      onChange(allowedValues[0].id);
    }
  }, [value, allowedValues, onChange]);

  if (allowedValues.length <= 1) return null;

  return (
    <Field
      label={characteristic.label}
      labelClassName="!items-start"
      required
      widgetId={characteristicId}
      renderWidget={(className) => (
        <select className={className} onChange={(e) => onChange(e.target.value)} value={value} id={characteristicId}>
          <option value="">Choisis une option</option>
          {allowedValues.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      )}
    />
  );
}
