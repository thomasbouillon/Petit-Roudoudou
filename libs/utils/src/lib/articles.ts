import { Article, ArticleStock } from '@prisma/client';
import { applyTaxes } from './taxes';

export function getArticleStockPriceTaxIncluded(skus: Article['skus'], stock: ArticleStock) {
  if (typeof stock.overrides?.price === 'number') {
    console.log(stock.overrides.price, applyTaxes(stock.overrides.price));
    return applyTaxes(stock.overrides.price);
  }
  const sku = skus.find((sku) => sku.uid === stock.sku);
  return applyTaxes(sku?.price ?? 0);
}
