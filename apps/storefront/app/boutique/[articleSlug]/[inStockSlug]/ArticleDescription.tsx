import { Article } from '@couture-next/types';

type Props = {
  article: Article;
  stockIndex: number;
};

export default function ArticleDescritpion({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];

  if (!stock.fullDescription) return null;

  return (
    <section className="flex flex-col items-center mt-16 mb-8 max-w-prose mx-auto">
      <h2 className="text-2xl font-serif mb-4">Description</h2>
      <div className="px-4 mx-4">{stock.fullDescription}</div>
    </section>
  );
}
