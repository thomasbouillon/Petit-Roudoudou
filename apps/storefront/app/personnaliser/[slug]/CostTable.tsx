import { Article } from '@couture-next/types';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type Props = {
  article: Article;
};

function getPriceFromCharacteristicValue(
  skus: Article['skus'],
  selection: { characteristicId: string; valueId: string }[]
) {
  return skus.find((sku) => {
    return selection.every((selection) => sku.characteristics[selection.characteristicId] === selection.valueId);
  })?.price;
}

export function CostTable({ article }: Props) {
  const searchParams = useSearchParams();
  const selectedVariantUid = searchParams.get('variant');

  const allowedSkus = useMemo(
    () => article.skus.filter((sku) => sku.customizableVariantUid === selectedVariantUid),
    [article.skus, selectedVariantUid]
  );

  const characteristicsToChooseFrom = useMemo(
    () =>
      Object.entries(article.characteristics)
        .filter(([characteristicId, characteristic]) => {
          const valuesToChooseFrom = Object.entries(characteristic.values).filter(([valueId]) =>
            allowedSkus.some((sku) => sku.characteristics[characteristicId] === valueId)
          );
          return valuesToChooseFrom.length > 1;
        })
        .map(([characteristicId, characteristic]) => ({ id: characteristicId, ...characteristic })),
    [article.characteristics, allowedSkus]
  );

  if (characteristicsToChooseFrom.length === 0) {
    return null;
  }

  if (characteristicsToChooseFrom.length > 2) {
    return <p>Essayez différentes combinaisons pour afficher le prix.</p>;
  }

  if (characteristicsToChooseFrom.length === 1) {
    return (
      <div className="my-6 space-y-2">
        <h3>Tableau des coûts</h3>
        <SingleCharacteristicTable characteristic={characteristicsToChooseFrom[0]} allowedSkus={allowedSkus} />
      </div>
    );
  }

  if (characteristicsToChooseFrom.length === 2) {
    return (
      <div className="my-6 space-y-2">
        <h3>Tableau des coûts</h3>
        <TwoCharacteristicsTable characteristics={characteristicsToChooseFrom} allowedSkus={allowedSkus} />
      </div>
    );
  }
}

type TwoCharacteristicsTableProps = {
  characteristics: (Article['characteristics'][string] & { id: string })[];
  allowedSkus: Article['skus'];
};

function TwoCharacteristicsTable({ characteristics, allowedSkus }: TwoCharacteristicsTableProps) {
  const cellClassName = 'border p-2 min-w-32 text-center';

  return (
    <table className="border-collapse mx-auto w-[95%] sm:w-auto">
      <thead>
        <tr>
          <th className={cellClassName}>
            {characteristics[0].label} \ {characteristics[1].label}
          </th>
          {Object.entries(characteristics[1].values).map(([valueId, valueLabel]) => (
            <th key={valueId} className={cellClassName}>
              {valueLabel}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(characteristics[0].values).map(([valueId1, valueLabel]) => (
          <tr key={valueId1}>
            <th className={cellClassName}>{valueLabel}</th>
            {Object.entries(characteristics[1].values).map(([valueId2]) => (
              <td key={valueId2} className={cellClassName}>
                {getPriceFromCharacteristicValue(allowedSkus, [
                  {
                    characteristicId: characteristics[0].id,
                    valueId: valueId1,
                  },
                  {
                    characteristicId: characteristics[1].id,
                    valueId: valueId2,
                  },
                ])}{' '}
                €
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SingleCharacteristicTableProps = {
  characteristic: Article['characteristics'][string] & { id: string };
  allowedSkus: Article['skus'];
};

function SingleCharacteristicTable({ characteristic, allowedSkus }: SingleCharacteristicTableProps) {
  const cellClassName = 'border p-2 min-w-32 text-center';

  return (
    <table className="border-collapse mx-auto w-full sm:w-auto">
      <thead>
        <tr>
          <th className={cellClassName}>{characteristic.label}</th>
          <th className={cellClassName}>Prix</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(characteristic.values).map(([valueId, valueLabel]) => (
          <tr key={valueId}>
            <td className={cellClassName}>{valueLabel}</td>
            <td className={cellClassName}>
              {getPriceFromCharacteristicValue(allowedSkus, [
                {
                  characteristicId: characteristic.id,
                  valueId,
                },
              ])}{' '}
              €
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
