import { PrettyPrice, Slides, StyledWrapper } from '@couture-next/ui';
import { Article, Customizable } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import AddToCartForm from './AddToCartForm';
import { StarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { applyTaxes } from '@couture-next/utils';

type Props = {
  article: Article;
  stockIndex: number;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function ArticleSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];
  const sku = article.skus.find((sku) => stock.sku === sku.uid);
  const hasCustomizables = Object.values(stock.inherits.customizables ?? {}).some(Boolean);

  return (
    <StyledWrapper className="bg-light-100 px-4 py-8">
      <h1 className="text-serif font-serif text-3xl text-center mb-8">{stock.title}</h1>
      <p className="text-center mb-4 md:hidden">
        <span className="sr-only">Prix:</span>
        {hasCustomizables && 'À partir de '}
        <PrettyPrice price={applyTaxes(sku?.price ?? -1)} />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8" id="inStockArticle_images-section">
        <Slides
          images={stock.images.map((img) => ({
            url: img.url,
            alt: '',
            placeholderDataUrl: img.placeholderDataUrl ?? undefined,
          }))}
          width={512}
          height={512}
          imageLoader={loader}
          className="w-screen md:aspect-square max-w-[32rem] h-[75vh] md:h-auto"
        />
        <div className="max-w-prose space-y-4">
          {article.aggregatedRating !== null && (
            <div className="flex items-center gap-2">
              <h2 className="sr-only">Avis clients</h2>
              <p className="flex items-center gap-2">
                <span className="font-bold ">Avis clients: {article.aggregatedRating.toFixed(1)}/5</span>{' '}
                <StarIcon className="w-6 h-6 text-primary-100" /> ({article.reviewIds.length} avis)
              </p>

              <Link href="#reviews" className="btn-light" id="inStockArticle_see-reviews-button">
                Voir les avis
              </Link>
            </div>
          )}
          <p className="sr-only">Prix de base:{applyTaxes(sku?.price ?? -1)}</p>
          <div>
            <h2 className="sr-only">Quantité en stock</h2>
            <p>{stock.stock > 0 ? `${stock.stock} en stock.` : 'Rupture de stock.'}</p>
          </div>
          <div>
            <h2 className="underline mb-2">Description</h2>
            <div className="line-clamp-5">
              {stock.description.split('\n').map((p, i) => (
                <p key={i} className="text-justify">
                  {p}
                </p>
              ))}
            </div>
            <Link href="#article-details" className="btn-light ml-auto" id="inStockArticle_see-more">
              Voir plus
            </Link>
          </div>
          <AddToCartForm
            outOfStock={stock.stock === 0}
            defaultValues={{
              type: 'inStock',
              articleId: article.id,
              stockUid: stock.uid,
              customizations: {},
            }}
            customizables={
              article.customizables.filter(
                (customizable) =>
                  customizable.type !== 'customizable-part' && stock.inherits.customizables[customizable.uid]
              ) as CustomizableNotPart[]
            }
            basePrice={sku?.price ?? -1}
          />
        </div>
      </div>
    </StyledWrapper>
  );
}
