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
import { Popover } from '@headlessui/react';

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
  const {
    fields: skus,
    append: appendSku,
    remove: removeSku,
  } = useFieldArray({
    control,
    name: 'skus',
  });

  const addValue = useCallback(() => {
    const valueId = uuid();
    setValue(`characteristics.${characteristicId}.values.${valueId}`, '', {
      shouldValidate: false,
    });

    const toClone = Object.keys(getValues(`characteristics.${characteristicId}.values`))[0];

    getValues('skus').forEach((sku) => {
      const characteristics = sku.characteristics;
      if (characteristics[characteristicId] !== toClone) return;

      appendSku({
        uid: uuid(),
        enabled: true,
        price: 0,
        weight: 0,
        characteristics: {
          ...characteristics,
          [characteristicId]: valueId,
        },
        composition: '',
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

  const removeCharacteristic = useCallback(() => {
    unregister(`characteristics.${characteristicId}`);
    const removedSkuUids: string[] = [];
    skus.forEach((_, i) => {
      unregister(`skus.${i}.characteristics.${characteristicId}`);
    });
    const previousSkus = getValues('skus');
    for (let i = previousSkus.length - 1; i >= 0; i--) {
      const sku = previousSkus[i];
      if (removedSkuUids.includes(sku.uid)) continue;
      // Remove similar skus
      skus.forEach((other, j) => {
        if (other.uid === sku.uid || removedSkuUids.includes(other.uid)) return;
        if (
          Object.keys(sku.characteristics).every(
            (key) =>
              key === characteristicId ||
              (key in other.characteristics && sku.characteristics[key] === other.characteristics[key])
          )
        ) {
          removeSku(j);
          removedSkuUids.push(other.uid);
        }
      });
    }
  }, [unregister, getValues, removeSku, characteristicId]);

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
          <input className={clsx(className, 'mt-2')} {...register(`characteristics.${characteristicId}.label`)} />
        )}
      />
      <div className="mt-4">
        <p>Valeurs</p>
        {Object.keys(watch(`characteristics.${characteristicId}.values`)).map((valueId) => (
          <React.Fragment key={valueId}>
            <div className="w-full relative mt-2">
              <input
                className="border rounded-md px-4 py-2 w-full"
                {...register(`characteristics.${characteristicId}.values.${valueId}`)}
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
            {!!errors.characteristics?.[characteristicId]?.values?.[valueId]?.message && (
              <small className="text-red-500">
                {errors.characteristics?.[characteristicId]?.values?.[valueId]?.message}
              </small>
            )}
          </React.Fragment>
        ))}
        <button type="button" className="btn-light w-full" onClick={addValue}>
          Ajouter une valeur
        </button>
        <Popover>
          <Popover.Button className="absolute top-4 right-0">
            <TrashIcon className="w-6 h-6 text-red-500" />
          </Popover.Button>
          <Popover.Overlay className="fixed inset-0 z-20 bg-black bg-opacity-25" />
          <Popover.Panel className="fixed max-w-prose top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-md p-4">
            <p className="text-xl text-center mb-2">Attention</p>
            <p>
              Tu es sur le point de supprimer la caractéristique "
              {watch(`characteristics.${characteristicId}.label`) || 'Sans nom'}", cela implique toutes les valeurs de
              ce paneau ainsi que certaines lignes dans le tableau des prix.
            </p>
            <p>Penses à bien vérifier ton tableau des prix près la confirmation.</p>
            <button type="button" className="btn-primary mx-auto mt-4 bg-red-500" onClick={removeCharacteristic}>
              Confirmer
            </button>
          </Popover.Panel>
        </Popover>
      </div>
    </fieldset>
  );
}
