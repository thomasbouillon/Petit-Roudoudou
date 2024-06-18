import { Article } from '@couture-next/types';
import { ArticleCarousel } from '../../../(articleCarousels)/articleCarousel';

type Props = {
  article: Article;
  stockUid: string;
};

export default function SimilarArticlesSection({ article, stockUid }: Props) {
  // exclude myself
  if (article.stocks.length === 1) return null;

  return (
    <div id="inStockArticle_similar-articles-section" className="w-full lg:max-w-[72rem] mx-auto">
      <h2 className="text-2xl font-serif col-span-full text-center">Créations similaires</h2>
      <ArticleCarousel article={article} stockUidBlacklist={[stockUid]} />
    </div>
  );
}
