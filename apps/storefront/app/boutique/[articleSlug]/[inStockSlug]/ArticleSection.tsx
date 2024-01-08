import { Slides, StyledWrapper } from '@couture-next/ui';
import { Article, Customizable } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import AddToCartForm from './AddToCartForm';
import { StarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

type Props = {
  article: Article;
  stockIndex: number;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function ArticleSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];

  const composition = article.skus.find((sku) => stock.sku === sku.uid)?.composition;

  return (
    <StyledWrapper className="bg-light-100 px-4 py-8">
      <h1 className="text-serif font-serif text-3xl text-center mb-8">{stock.title}</h1>
      <div className="flex flex-wrap items-center justify-center gap-8" id="[inStockArticle]images-section">
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
              <Link href="#reviews" className="btn-light" id="[inStockArticle]see-reviews-button">
                Voir les avis
              </Link>
            </div>
          )}
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
