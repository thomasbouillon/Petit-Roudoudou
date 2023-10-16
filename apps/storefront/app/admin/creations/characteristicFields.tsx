import { Field } from '@couture-next/ui';
import { ArticleFormType } from './form';
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
  type UseFormUnregister,
  type Control,
  useFieldArray,
  UseFormGetValues,
} from 'react-hook-form';
import React, { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import clsx from 'clsx';
import { TrashIcon } from '@heroicons/react/24/outline';

type Props = {
  characteristicId: string;
  register: UseFormRegister<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  unregister: UseFormUnregister<ArticleFormType>;
  control: Control<ArticleFormType>;
  getValues: UseFormGetValues<ArticleFormType>;
};

export default function CharacteristicFields({
  characteristicId,
  register,
  watch,
  control,
  errors,
  setValue,
  unregister,
  getValues,
}: Props) {
  const { append: appendSku, remove: removeSku } = useFieldArray({
    control,
    name: 'skus',
  });

  const addValue = useCallback(() => {
    const valueId = uuid();
    setValue(`characteristics.${characteristicId}.values.${valueId}`, '', {
      shouldValidate: false,
    });

    const toClone = Object.keys(
      getValues(`characteristics.${characteristicId}.values`)
    )[0];

    getValues('skus').forEach((sku) => {
      const characteristics = sku.characteristics;
      if (characteristics[characteristicId] !== toClone) return;

      appendSku({
        enabled: true,
        price: 0,
        weight: 0,
        stock: 0,
        characteristics: {
          ...characteristics,
          [characteristicId]: valueId,
        },
      });
    });
  }, [characteristicId, setValue, appendSku, getValues]);

  const removeValue = useCallback(
    (valueId: string) => {
      unregister(`characteristics.${characteristicId}.values.${valueId}`);
      getValues('skus').forEach((sku, i) => {
        const characteristics = sku.characteristics;
        if (characteristics[characteristicId] !== valueId) return;
        removeSku(i);
      });
    },
    [unregister, characteristicId, removeSku, getValues]
  );

  const values = watch(`characteristics.${characteristicId}.values`);
  const isLastValue = Object.keys(values).length === 1;

  return (
    <fieldset className="max-w-md mx-auto">
      <Field
        label="Nom de la caractéristique"
        labelClassName="!items-start"
        widgetId={characteristicId}
        error={errors.characteristics?.[characteristicId]?.label?.message}
        renderWidget={(className) => (
          <input
            className={clsx(className, 'mt-2')}
            {...register(`characteristics.${characteristicId}.label`)}
          />
        )}
      />
      <div className="mt-4">
        <p>Valeurs</p>
        {Object.keys(watch(`characteristics.${characteristicId}.values`)).map(
          (valueId) => (
            <React.Fragment key={valueId}>
              <div className="w-full relative mt-2">
                <input
                  className="border rounded-md px-4 py-2 w-full"
                  {...register(
                    `characteristics.${characteristicId}.values.${valueId}`
                  )}
                />
                <button
                  className={clsx(
                    'absolute top-1/2 -right-0 translate-x-[2rem] -translate-y-1/2',
                    isLastValue && 'cursor-not-allowed'
                  )}
                  onClick={() => removeValue(valueId)}
                  disabled={isLastValue}
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              </div>
              {!!errors.characteristics?.[characteristicId]?.values?.[valueId]
                ?.message && (
                <small className="text-red-500">
                  {
                    errors.characteristics?.[characteristicId]?.values?.[
                      valueId
                    ]?.message
                  }
                </small>
              )}
            </React.Fragment>
          )
        )}
        <button type="button" className="btn-light w-full" onClick={addValue}>
          Ajouter une valeur
        </button>
      </div>
    </fieldset>
  );
}
