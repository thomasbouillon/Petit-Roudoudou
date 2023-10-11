import { Field } from '@couture-next/ui';
import { ArticleFormType } from './form';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormUnregister,
} from 'react-hook-form';
import { useCallback } from 'react';
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
};

export default function CharacteristicFields({
  characteristicId,
  register,
  watch,
  errors,
  setValue,
  unregister,
}: Props) {
  const addValue = useCallback(() => {
    const valueId = uuid();
    setValue(`characteristics.${characteristicId}.values.${valueId}`, '', {
      shouldValidate: false,
    });
  }, [characteristicId, setValue]);

  const removeValue = useCallback(
    (valueId: string) => {
      unregister(`characteristics.${characteristicId}.values.${valueId}`);
    },
    [unregister, characteristicId]
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
            <>
              <div className="w-full relative mt-2">
                <input
                  key={valueId}
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
            </>
          )
        )}
        <button type="button" className="btn-light w-full" onClick={addValue}>
          Ajouter une valeur
        </button>
      </div>
    </fieldset>
  );
}
