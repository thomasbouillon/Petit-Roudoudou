import { Slides, StyledWrapper } from '@couture-next/ui';
import { Article, Customizable } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import AddToCartForm from './AddToCartForm';

type Props = {
  article: Article;
  stockIndex: number;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function ArticleSection({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];

  return (
    <StyledWrapper className="bg-light-100 px-4 py-8">
      <h1 className="text-serif font-serif text-3xl text-center mb-8">{stock.title}</h1>
      <div className="flex flex-wrap items-center justify-center gap-8">
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
        <div className="max-w-prose">
          <div>
            {stock.description.split('\n').map((p, i) => (
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
