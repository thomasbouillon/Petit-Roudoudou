import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { ArticleFormType } from './form';
import { Sku } from '@couture-next/types';
import { useCallback } from 'react';
import { Popover } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SKUFields() {
  const { register } = useFormContext<ArticleFormType>();
  const { errors } = useFormState<ArticleFormType>();

  const characteristics = useWatch<ArticleFormType, 'characteristics'>({ name: 'characteristics' });
  const characteristicIds = Object.keys(characteristics);
  const skuScoreForPosition = useCallback(
    (skuCharacteristic: Sku['characteristics']) =>
      characteristicIds.reduce((acc, characteristicId) => {
        return acc + '-' + skuCharacteristic[characteristicId];
      }, ''),
    [characteristicIds]
  );
  const sortedSkus = useWatch<ArticleFormType, 'skus'>({ name: 'skus' })
    .map((sku, i) => ({
      ...sku,
      originalPosition: i,
    }))
    .sort((a, b) => (skuScoreForPosition(a.characteristics) > skuScoreForPosition(b.characteristics) ? 1 : -1));

  const characteristicValueLabelFromId = useCallback(
    (characteristicId: string, valueId: string) => characteristics[characteristicId].values[valueId],
    [characteristics]
  );

  const customizableVariants = useWatch<ArticleFormType, 'customizableVariants'>({
    name: 'customizableVariants',
  });

  return (
    <fieldset className="">
      <p className="col-span-2 text-gray-500 text-xs text-center mb-4">
        Ici, tu peux saisir toutes les spécificités de chaque variante de ton article.
      </p>
      <table className="mx-auto rounded-sm shadow-sm">
        <thead>
          <tr>
            {Object.entries(characteristics).map(([characteristicId, characteristic]) => (
              <th key={characteristicId} className="border px-4 py-2">
                {characteristic.label}
              </th>
            ))}
            <th className="border px-4 py-2">Prix (HT)</th>
            <th className="border px-4 py-2">Poids</th>
            <th className="border px-4 py-2">3D</th>
            <th className="border px-4 py-2">Composition</th>
            <th className="border px-4 py-2">GTIN</th>
          </tr>
        </thead>
        <tbody>
          {sortedSkus.map((sku) => (
            <tr key={skuScoreForPosition(sku.characteristics)}>
              {Object.entries(sku.characteristics).map(([characteristicId, valueId]) => (
                <td key={characteristicId} className="border px-4 py-2">
                  {characteristicValueLabelFromId(characteristicId, valueId)}
                </td>
              ))}
              <td className="border px-4 py-2">
                <input
                  type="number"
                  className="text-end w-24 mr-1"
                  step="0.01"
                  min="0"
                  {...register(`skus.${sku.originalPosition}.price`, { valueAsNumber: true })}
                />
                €
              </td>
              <td className="border px-4 py-2">
                <input
                  type="number"
                  className="text-end w-24 mr-1"
                  step="1"
                  min="0"
                  {...register(`skus.${sku.originalPosition}.weight`, { valueAsNumber: true })}
                />
                g
              </td>
              <td className="border px-4 py-2">
                <select
                  className="text-end w-24 mr-1"
                  {...register(`skus.${sku.originalPosition}.customizableVariantUid`)}
                >
                  <option value={''}>Pas personnalisable</option>
                  {customizableVariants.map((customizableVariant) => (
                    <option key={customizableVariant.uid} value={customizableVariant.uid}>
                      {customizableVariant.name || '(sans nom)'}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border">
                <textarea
                  rows={2}
                  className="text-end w-full h-full px-4 py-2"
                  {...register(`skus.${sku.originalPosition}.composition`)}
                />
              </td>
              <td className="border">
                <input type="text" className="text-end w-24 mr-1" {...register(`skus.${sku.originalPosition}.gtin`)} />
              </td>
              <td>
                {!!errors.skus?.[sku.originalPosition] && (
                  <Popover className="relative">
                    <Popover.Button className="flex items-center">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    </Popover.Button>
                    <Popover.Panel className="absolute right-1/2 translate-x-1/2 z-10 w-44 border border-red-500 rounded-sm">
                      <div className="bg-white rounded-sm shadow-sm p-2 pl-6">
                        <ul>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[sku.originalPosition]?.price?.message}
                          </li>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[sku.originalPosition]?.weight?.message}
                          </li>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[sku.originalPosition]?.composition?.message}
                          </li>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[sku.originalPosition]?.gtin?.message}
                          </li>
                          <li className="list-disc empty:hidden">
                            {errors.skus?.[sku.originalPosition]?.customizableVariantUid?.message}
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
