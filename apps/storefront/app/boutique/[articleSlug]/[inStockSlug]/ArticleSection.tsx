import { PrettyPrice } from '@couture-next/ui/PrettyPrice';
import { Slides } from '@couture-next/ui/Slides';
import { StyledWrapper } from '@couture-next/ui/StyledWrapper';
import { Article, Option } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import AddToCartForm from './AddToCartForm';
import { InformationCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { applyTaxes } from '@couture-next/utils';

import { routes } from '@couture-next/routing';
import ArticleVariantSelector from './ArticleVariantSelector';

type Props = {
  article: Article;
  stockIndex: number;
};

type CustomizableNotPiping = Exclude<Option, { type: 'customizable-piping' /** not supported yet */ }>;

export default function ArticleSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];
  const sku = article.skus.find((sku) => stock.sku === sku.uid);

  if (!sku) throw new Error('Stock without sku');

  return (
    <StyledWrapper className="bg-light-100 py-8 ">
      <div className="text-center space-y-2 mb-4 lg:sr-only">
        <h1 className="font-serif text-3xl">{stock.title}</h1>
        <p className="text-lg">
          <span className="sr-only">Prix:</span>
          <span>{applyTaxes(sku.price ?? -1).toFixed(2)} €</span>
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-24" id="inStockArticle_images-section">
        <Slides
          images={stock.images.map((img) => ({
            url: img.url,
            alt: '',
            placeholderDataUrl: img.placeholderDataUrl ?? undefined,
          }))}
          width={512}
          height={512}
          imageLoader={loader}
          className="w-screen max-w-[32rem] mx-auto lg:mr-0 lg:sticky lg:top-[3.75rem] lg:bottom-0"
        />
        <div className="max-w-sm flex flex-col mx-auto lg:ml-0 px-4 lg:px-0">
          <div aria-hidden className="mb-6">
            <p className="text-center text-3xl font-serif sm:text-start block mb-2">{stock.title}</p>
            <PrettyPrice price={applyTaxes(sku.price ?? -1)} />
          </div>
          {article.aggregatedRating !== null && (
            <div className="grid grid-cols-[1fr_auto] mb-6">
              <h2 className="sr-only">Avis clients</h2>
              <p className="flex items-center gap-2">
                <span className="font-bold ">Avis clients: {article.aggregatedRating.toFixed(1)}/5</span>{' '}
                <StarIcon className="w-6 h-6 text-primary-100" /> ({article.reviewIds.length} avis)
              </p>
              <Link href="#reviews" className="btn-light p-0" id="inStockArticle_see-reviews-button">
                Voir les avis
              </Link>
            </div>
          )}
          <p className="sr-only">Prix de base:{applyTaxes(sku.price ?? -1)}</p>
          <ArticleVariantSelector article={article} currentStock={stock} />
          <div className="mt-2">
            <h2 className="sr-only">Quantité en stock</h2>
            {stock.stock > 1 ? (
              <p>
                <strong>{stock.stock}</strong> en stock.
              </p>
            ) : stock.stock === 1 ? null : (
              <>
                <p className="text-red-500 text-center font-bold mb-2">Rupture de stock.</p>
                <p className="border border-black p-2 flex items-center gap-2">
                  <InformationCircleIcon className="text-primary-100 w-8 h-8" /> Pas de panique, tu peux faire sur
                  mesure ci-dessous ou choisir un autre modèle
                </p>
              </>
            )}
          </div>
          <AddToCartForm
            outOfStock={stock.stock === 0}
            defaultValues={{
              type: 'inStock',
              articleId: article.id,
              stockUid: stock.uid,
              customizations: {},
              quantity: 1,
            }}
            maxQuantity={stock.stock}
            customizables={
              article.customizables.filter(
                (customizable) =>
                  customizable.type !== 'customizable-piping' && stock.inherits.customizables[customizable.uid]
              ) as CustomizableNotPiping[]
            }
            basePrice={sku.price ?? -1}
          />
          {article.customizableVariants.length > 0 && (
            <div className="mt-6">
              <p>Cette création est sympa, mais pas P.A.R.F.A.I.T.E pour toi?</p>
              <Link
                href={routes()
                  .shop()
                  .customize(article.slug, sku.customizableVariantUid ?? undefined)}
                className="btn-secondary w-full text-center bg-white "
              >
                Je choisis mes tissus
              </Link>
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
}
