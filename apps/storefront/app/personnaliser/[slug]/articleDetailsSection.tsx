import { Article } from '@couture-next/types';
import { applyTaxes } from '@couture-next/utils';
import { useWatch } from 'react-hook-form';
import { AddToCartFormType } from './app';

type Props = {
  article: Article;
};

export function ArticleDetailsSection({ article }: Props) {
  const skuId = useWatch<AddToCartFormType>({ name: 'skuId' });
  const sku = article.skus.find((sku) => skuId === sku.uid);

  const placeholderPhrase = 'Remplis le fomulaire ci-dessus pour en savoir plus.';
  const composition = sku?.composition ?? placeholderPhrase;
  const hasOptions = Object.keys(article.customizables).length > 0;

  const headerClassName = 'block px-2 text-start sm:text-right sm:py-2';
  const rowClassName = 'first:border-t-0 border-t first border-gray-300 block sm:table-row p-2';
  const cellClassName = 'px-2 max-w-prose sm:py-2';

  const characteristicsWithValues = Object.entries(sku?.characteristics ?? {}).map(([characteristicId, valueId]) => {
    const characteristic = article.characteristics[characteristicId];
    const valueLabel = characteristic.values[valueId];
    return { characteristicLabel: characteristic.label, valueLabel };
  });

  return (
    <section className="flex flex-col items-center mt-16">
      <h3 className="text-2xl font-serif mb-4">Informations</h3>
      <div className="border mx-4">
        <table className="max-sm:block">
          <tbody className="max-sm:block">
            <tr className={rowClassName}>
              <th className={headerClassName}>Nom</th>
              <td className={cellClassName}>{article.name}</td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Lieu de fabrication</th>
              <td className={cellClassName}>Nancy (France)</td>
            </tr>
            {article.aggregatedRating !== null && (
              <tr className={rowClassName}>
                <th className={headerClassName}>Avis clients</th>
                <td className={cellClassName}>
                  {article.aggregatedRating?.toFixed(1)}/5 ({article.reviewIds.length} avis)
                </td>
              </tr>
            )}
            {characteristicsWithValues.map(({ characteristicLabel, valueLabel }) => (
              <tr key={characteristicLabel} className={rowClassName}>
                <th className={headerClassName}>{characteristicLabel}</th>
                <td className={cellClassName}>{valueLabel}</td>
              </tr>
            ))}
            <tr className={rowClassName}>
              <th className={headerClassName}>
                Prix<span>{hasOptions && ' hors options'}</span>
              </th>
              <td className={cellClassName}>{sku ? applyTaxes(sku.price).toFixed(2) + ' €' : placeholderPhrase}</td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Description</th>
              <td className={cellClassName}>
                {article.description.split('\n').map((p, i) => (
                  <p key={i} className="text-justify">
                    {p}
                  </p>
                ))}
              </td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Composition</th>
              <td className={cellClassName}>
                {composition?.split('\n').map((p, i) => (
                  <p key={i} className="text-justify">
                    {p}
                  </p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
