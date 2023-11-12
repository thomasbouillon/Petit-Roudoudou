import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { ArticleFormType } from './form';
import { Sku } from '@couture-next/types';
import { useCallback } from 'react';
import { Popover } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SKUFields({
  register,
  errors,
  watch,
}: {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
}) {
  const characteristicIds = Object.keys(watch('characteristics'));
  const skuScoreForPosition = useCallback(
    (skuCharacteristic: Sku['characteristics']) =>
      characteristicIds.reduce((acc, characteristicId) => {
        return acc + '-' + skuCharacteristic[characteristicId];
      }, ''),
    [characteristicIds]
  );
  const sortedSkus = watch('skus', [])
    .map((sku, i) => ({
      ...sku,
      originalPosition: i,
    }))
    .sort((a, b) =>
      skuScoreForPosition(a.characteristics) >
      skuScoreForPosition(b.characteristics)
        ? 1
        : -1
    );

  const characteristicValueLabelFromId = useCallback(
    (characteristicId: string, valueId: string) =>
      watch('characteristics')[characteristicId].values[valueId],
    [watch]
  );

  return (
    <fieldset className="">
      <p className="col-span-2 text-gray-500 text-xs text-center mb-4">
        Ici, tu peux saisir toutes les spécificités de chaque variante de ton
        article.
      </p>
      <table className="mx-auto rounded-sm shadow-sm">
        <thead>
          <tr>
            {Object.entries(watch('characteristics')).map(
              ([characteristicId, characteristic]) => (
                <th key={characteristicId} className="border px-4 py-2">
                  {characteristic.label}
                </th>
              )
            )}
            <th className="border px-4 py-2">Prix (HT)</th>
            <th className="border px-4 py-2">Poids</th>
          </tr>
        </thead>
        <tbody>
          {sortedSkus.map((sku, i) => (
            <tr key={skuScoreForPosition(sku.characteristics)}>
              {Object.entries(sku.characteristics).map(
                ([characteristicId, valueId]) => (
                  <td key={characteristicId} className="border px-4 py-2">
                    {characteristicValueLabelFromId(characteristicId, valueId)}
                  </td>
                )
              )}
              <td className="border px-4 py-2">
                <input
                  type="number"
                  className="text-end w-24 mr-1"
                  step="0.01"
                  min="0"
                  {...register(`skus.${i}.price`, { valueAsNumber: true })}
                />
                €
              </td>
              <td className="border px-4 py-2">
                <input
                  type="number"
                  className="text-end w-24 mr-1"
                  step="1"
                  min="0"
                  {...register(`skus.${i}.weight`, { valueAsNumber: true })}
                />
                g
              </td>
              <td>
                {!!errors.skus?.[i] && (
                  <Popover className="relative">
                    <Popover.Button className="flex items-center">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    </Popover.Button>
                    <Popover.Panel className="absolute right-1/2 translate-x-1/2 z-10 w-44 border border-red-500 rounded-sm">
                      <div className="bg-white rounded-sm shadow-sm p-2 pl-6">
                        <ul>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[i]?.price?.message}
                          </li>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[i]?.weight?.message}
                          </li>
                        </ul>
                      </div>
                    </Popover.Panel>
                  </Popover>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  );
}
