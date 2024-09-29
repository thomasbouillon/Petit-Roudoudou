import { Article } from '@couture-next/types';
import clsx from 'clsx';
import { useMemo } from 'react';
import ArticleStockFabricsPreview from './ArticleStockFabricsPreview';

type Props = {
  article: Article;
  currentStock: Article['stocks'][number];
};

export default function ArticleVariantSelector({ article, currentStock }: Props) {
  const currentSku = useMemo(
    () => article.skus.find((s) => s.uid === currentStock.sku),
    [article.skus, currentStock.sku]
  );
  if (!currentSku) throw new Error('currentSku not found');

  const similarSkus = useMemo(
    () => article.skus.filter((s) => currentSku.customizableVariantUid === s.customizableVariantUid),
    [article.skus, currentSku.customizableVariantUid]
  );

  const characteristics = useMemo(
    () =>
      Object.entries(article.characteristics)
        .map(([uid, characteristic]) => ({
          ...characteristic,
          uid,
          values: Object.entries(characteristic.values)
            .map(([valueUid, label]) => ({
              label,
              uid: valueUid,
              matchingSkuCount: similarSkus.filter((s) => s.characteristics[uid] === valueUid).length,
            }))
            .filter((v) => v.matchingSkuCount > 0),
        }))
        .filter((c) => c.values.length > 1),
    [article.characteristics, similarSkus]
  );

  const stocksFromCurrrentSku = article.stocks.filter((s) => s.sku === currentSku.uid);

  return (
    <div className="space-y-4">
      {characteristics.map((c) => (
        <div key={c.uid}>
          <h2>{c.label}</h2>
          <ul className="grid grid-cols-2 gap-2">
            {c.values.map((v) => (
              <li
                key={v.uid}
                className={clsx(
                  'border-2 bg-white p-2',
                  currentSku.characteristics[c.uid] === v.uid && 'border-primary-100'
                )}
              >
                <label>
                  {/* <input type="radio" name={c.uid} value={v.uid} /> */}
                  {v.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <h2>Disponibles en stock</h2>
        <ul className="grid grid-cols-6 gap-4">
          {stocksFromCurrrentSku.map((s) => (
            <li key={s.uid} className={clsx(currentStock.uid === s.uid && 'outline outline-2 outline-primary-100')}>
              <ArticleStockFabricsPreview fabricIds={s.fabricIds} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
