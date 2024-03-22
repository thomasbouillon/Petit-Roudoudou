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
  const composition = article.skus.find((sku) => stock.sku === sku.uid)?.composition;

  return (
    <StyledWrapper className="bg-light-100 px-4 py-8">
      <h1 className="text-serif font-serif text-3xl text-center mb-8">{stock.title}</h1>
      <p className="text-center mb-4 sm:hidden">
        <span className="sr-only">Prix:</span>
        <PrettyPrice price={sku?.price ?? -1} />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8" id="inStockArticle_images-section">
        <Slides
          images={stock.images.map((img) => ({
            url: img.url,
            alt: 'test',
            placeholderDataUrl: img.placeholderDataUrl,
          }))}
          width={512}
          height={512}
          imageLoader={loader}
          className="w-screen md:aspect-square max-w-[600px] h-[75vh] md:h-auto"
        />
        <div className="max-w-prose space-y-4">
          {article.aggregatedRating !== undefined && (
            <div className="flex items-center gap-2">
              <h2 className="sr-only">Avis clients</h2>
              <p className="font-bold">Avis clients: {article.aggregatedRating.toFixed(1)}/5</p>
              <StarIcon className="w-6 h-6 text-primary-100" />
              <Link href="#reviews" className="btn-light" id="inStockArticle_see-reviews-button">
                Voir les avis
              </Link>
            </div>
          )}
          <p className="hidden sm:block">
            <span className="sr-only">Prix:</span>
            <PrettyPrice price={applyTaxes(sku?.price ?? -1)} />
          </p>
          <div>
            <h2 className="sr-only">Quantité en stock</h2>
            <p>{stock.stock > 0 ? `${stock.stock} en stock.` : 'Rupture de stock.'}</p>
          </div>
          <div>
            <h2 className="underline mb-2">Description</h2>
            {stock.description.split('\n').map((p, i) => (
              <p key={i} className="text-justify">
                {p}
              </p>
            ))}
          </div>
          <div>
            <h2 className="underline">Composition</h2>
            {composition?.split('\n').map((p, i) => (
              <p key={i} className="text-justify">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <AddToCartForm
        outOfStock={stock.stock === 0}
        defaultValues={{
          type: 'add-in-stock-item',
          articleId: article._id,
          stockUid: stock.uid,
          customizations: {},
        }}
        customizables={
          article.customizables.filter(
            (customizable) =>
              customizable.type !== 'customizable-part' && stock.inherits.customizables[customizable.uid]
          ) as CustomizableNotPart[]
        }
      />
    </StyledWrapper>
  );
}
