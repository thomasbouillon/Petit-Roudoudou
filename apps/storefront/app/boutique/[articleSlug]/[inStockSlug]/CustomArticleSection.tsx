import { Article } from '@couture-next/types';
import Card from '@couture-next/ui/card';
import { routes } from '@couture-next/routing';
import { StyledWrapper } from '@couture-next/ui/StyledWrapper';
import { applyTaxes } from '@couture-next/utils';
import Link from 'next/link';

type Props = {
  article: Article;
};

const getMinimumPriceFromSkus = (skus: Article['skus']) => Math.min(...skus.map((sku) => sku.price));

export default function CustomArticleSection({ article }: Props) {
  if (article.customizableVariants.length === 0 || !article.enabled) return null;
  return (
    <StyledWrapper className="px-4 bg-light-100 pt-8 pb-16" id="inStockArticle_custom-article-section">
      <h2 className="text-2xl font-serif text-center ">Sur mesure</h2>
      <p className="mt-8 max-w-prose text-justify mx-auto w-full">
        Cette création est sympa, mais pas <span className="whitespace-nowrap">P.A.R.F.A.I.T.E</span> pour toi? Pas de
        soucis, tu peux la personnaliser ci-dessous. 😎
      </p>
      <div className="w-96 max-w-full mx-auto mt-8 relative overflow-visible">
        <Card
          title={article.name}
          description={article.shortDescription}
          image={article.images[0].url}
          placeholderDataUrl={article.images[0].placeholderDataUrl ?? undefined}
          price={applyTaxes(getMinimumPriceFromSkus(article.skus))}
          buttonLabelSrOnly="Je choisis mes tissus"
          buttonLink={routes().shop().customize(article.slug)}
          variant="customizable-article"
          className="pb-8"
        />
        <Link
          href={routes().shop().customize(article.slug)}
          className="btn-primary absolute left-1/2 -translate-x-1/2 text-center w-10/12 -translate-y-8"
        >
          Je choisis mes tissus
        </Link>
      </div>
    </StyledWrapper>
  );
}
