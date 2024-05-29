import { Article } from '@couture-next/types';

type Props = {
  article: Article;
  stockIndex: number;
};

export default function ArticleDescritpion({ article, stockIndex }: Props) {
  const stock = article.stocks[stockIndex];

  if (!stock.fullDescription) return null;

  return (
    <section className="flex flex-col items-center mt-16 mb-8 max-w-prose mx-auto px-4">
      <h2 className="text-2xl font-serif mb-4">Description</h2>
      <div className="space-y-2">
        {stock.fullDescription.split('\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
