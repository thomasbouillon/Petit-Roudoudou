import { PrettyPrice, Slides, StyledWrapper } from '@couture-next/ui';
import { Article, Customizable } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import AddToCartForm from './AddToCartForm';
import { StarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { applyTaxes } from '@couture-next/utils';

import { routes } from '@couture-next/routing';

type Props = {
  article: Article;
  stockIndex: number;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function ArticleSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];
  const sku = article.skus.find((sku) => stock.sku === sku.uid);

  return (
    <StyledWrapper className="bg-light-100 py-8 ">
      <div className="flex flex-wrap  justify-center gap-24 " id="inStockArticle_images-section">
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
        <div className="max-w-sm  lg:pr-6 flex flex-col ">
          <h1 className="text-serif font-serif text-3xl">{stock.title}</h1>
          <p className="">
            <span className="sr-only">Prix:</span>
            <PrettyPrice price={applyTaxes(sku?.price ?? -1)} />
          </p>
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
            <p>
              {stock.stock > 0 ? (
                <>
                  <strong>{stock.stock}</strong> en stock.
                </>
              ) : (
                'Rupture de stock.'
              )}
            </p>
          </div>
          <div>
            <div className="line-clamp-6 pt-4">
              {stock.description.split('\n').map((p, i) => (
                <p key={i} className="text-justify">
                  {p}
                </p>
              ))}
            </div>
            <Link href="#article-details" className="btn-light px-0 py-2" id="inStockArticle_see-more">
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
              quantity: 1,
            }}
            maxQuantity={stock.stock}
            customizables={
              article.customizables.filter(
                (customizable) =>
                  customizable.type !== 'customizable-part' && stock.inherits.customizables[customizable.uid]
              ) as CustomizableNotPart[]
            }
            basePrice={sku?.price ?? -1}
          />
          {/*Affichage du bouton personnalisée faudra créer un composant pour rediriger vers la page custom de l'article avec les tissus déjà choisi*/}
          <div className="mt-6">
            <p>Cette création est sympa, mais pas P.A.R.F.A.I.T.E pour toi?</p>
            <Link
              href={routes().shop().customize(article.slug)}
              className="btn-secondary w-full text-center bg-white mt-2"
            >
              Je choisis mes tissus
            </Link>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}
