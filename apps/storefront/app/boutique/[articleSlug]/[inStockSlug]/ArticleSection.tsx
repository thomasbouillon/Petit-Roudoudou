import { Slides, StyledWrapper } from '@couture-next/ui';
import AddToCartButton from './AddToCartButton';
import { Article } from '@couture-next/types';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';

type Props = {
  article: Article;
  stockIndex: number;
};

export default function ArticleSection({ article, stockIndex }: Props) {
  return (
    <StyledWrapper className="bg-light-100 px-4 py-8">
      <h1 className="text-serif font-serif text-3xl text-center mb-8">
        {article.stocks[stockIndex].title}
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-8">
        <Slides
          images={article.stocks[stockIndex].images.map((img) => ({
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
            {article.stocks[stockIndex].description.split('\n').map((p, i) => (
              <p key={i} className="text-justify">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
      <AddToCartButton
        payload={{
          type: 'add-in-stock-item',
          articleId: article._id,
          stockUid: article.stocks[stockIndex].uid,
        }}
      />
    </StyledWrapper>
  );
}
