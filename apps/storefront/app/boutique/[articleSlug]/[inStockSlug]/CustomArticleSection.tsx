import { Article } from '@couture-next/types';
import Card from '../../card';
import { routes } from '@couture-next/routing';
import { StyledWrapper } from '@couture-next/ui';
import { applyTaxes } from '@couture-next/utils';

type Props = {
  article: Article;
  stockIndex: number;
};

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));

export default function CustomArticleSection({ article, stockIndex }: Props) {
  return (
    <StyledWrapper className="px-4 bg-light-100 py-8" id="inStockArticle_custom-article-section">
      <h2 className="text-2xl font-serif text-center ">Sur mesure</h2>
      <p className="mt-8 max-w-prose text-justify mx-auto w-96">
        Cette création est sympa, mais pas <span className="whitespace-nowrap">P.A.R.F.A.I.T.E</span> pour toi? Pas de
        soucis, tu peux la personnaliser ci-dessous. 😎
      </p>
      <div className="w-96 max-w-full mx-auto mt-8">
        <Card
          title={article.name}
          description={article.shortDescription}
          image={article.images[0].url}
          placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
          price={applyTaxes(getMinimumPriceFromSkus(article.skus))}
          buttonLabel="Personnaliser"
          buttonLink={routes().shop().customize(article.slug)}
          variant="customizable-article"
        />
      </div>
    </StyledWrapper>
  );
}
