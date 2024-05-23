import { Article } from '@couture-next/types';
import { applyTaxes } from '@couture-next/utils';

type Props = {
  article: Article;
  stockIndex: number;
};

export default function ArticleDetailsSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];
  const sku = article.skus.find((sku) => stock.sku === sku.uid);
  if (!sku) return null;

  const composition = article.skus.find((sku) => stock.sku === sku.uid)?.composition;

  const hasCustomizables = Object.values(stock.inherits.customizables ?? {}).some(Boolean);
  const headerClassName = 'text-right block p-2';
  const rowClassName = 'border-t border-gray-300';
  const cellClassName = 'p-2 max-w-prose';

  const characteristicsWithValues = Object.entries(sku.characteristics).map(([characteristicId, valueId]) => {
    const characteristic = article.characteristics[characteristicId];
    const valueLabel = characteristic.values[valueId];
    return { characteristicLabel: characteristic.label, valueLabel };
  });

  return (
    <section className="flex flex-col items-center mt-16 mb-8" id="article-details">
      <h2 className="text-2xl font-serif mb-4">Informations</h2>
      <div className="border px-4 mx-4">
        <table>
          <tbody>
            <tr>
              <th className={headerClassName}>Nom</th>
              <td className={cellClassName}>{stock.title}</td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Lieu de confection</th>
              <td className={cellClassName}>Nancy (France)</td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Lieu de fabrication</th>
              <td className={cellClassName}>Nancy (France)</td>
            </tr>
            {characteristicsWithValues.map(({ characteristicLabel, valueLabel }) => (
              <tr key={characteristicLabel} className={rowClassName}>
                <th className={headerClassName}>{characteristicLabel}</th>
                <td className={cellClassName}>{valueLabel}</td>
              </tr>
            ))}
            {article.aggregatedRating !== null && (
              <tr className={rowClassName}>
                <th className={headerClassName}>Avis clients</th>
                <td className={cellClassName}>
                  {article.aggregatedRating?.toFixed(1)}/5 ({article.reviewIds.length} avis)
                </td>
              </tr>
            )}
            <tr className={rowClassName}>
              <th className={headerClassName}>
                Prix<span>{hasCustomizables && ' hors options'}</span>
              </th>
              <td className={cellClassName}>{applyTaxes(sku.price).toFixed(2)} €</td>
            </tr>
            <tr className={rowClassName}>
              <th className={headerClassName}>Détails</th>
              <td className={cellClassName}>
                {stock.description.split('\n').map((p, i) => (
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
