import { Article } from '@couture-next/types';
import { firebaseServerImageLoader as loader, generateMetadata as prepareMetadata } from '@couture-next/utils';
import { notFound } from 'next/navigation';
import ArticleSection from './ArticleSection';
import SimilarArticlesSection from './SimilarArticlesSection';
import CustomArticleSection from './CustomArticleSection';
import ReviewsSection from './ReviewsSections';
import ArticleDescritpion from './ArticleDescription';
import { BreadCrumbsNav, WithStructuedDataWrapper } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';
import env from '../../../../env';
import ArticleDetailsSection from './ArticleDetailsSection';
import { trpc } from 'apps/storefront/trpc-server';
import { TRPCClientError } from '@trpc/client';

type Props = {
  params: {
    articleSlug: string;
    inStockSlug: string;
  };
};

const getArticleBySlug = async (articleSlug: string) => {
  const article = await trpc.articles.findBySlug.query(articleSlug).catch((e) => {
    if (e instanceof TRPCClientError) {
      if (e.data?.code === 'NOT_FOUND') return notFound();
    }
    throw e;
  });
  return article;
};

export const generateMetadata = async ({ params: { articleSlug, inStockSlug } }: Props) => {
  const article = (await getArticleBySlug(articleSlug)) as Article;
  const stockIndex = article.stocks.findIndex((stock) => stock.slug === inStockSlug);

  return prepareMetadata({
    title: article.stocks[stockIndex].seo.title,
    alternates: { canonical: routes().shop().article(article.slug).showInStock(inStockSlug) },
    description: article.stocks[stockIndex].seo.description,
    openGraph: {
      locale: 'fr_FR',
      url: routes().shop().article(articleSlug).showInStock(inStockSlug),
      siteName: 'Petit Roudoudou',
      title: article.stocks[stockIndex].seo.title,
      description: article.stocks[stockIndex].seo.description,
      images: article.stocks[stockIndex].images.map((image) =>
        loader({ cdnBaseUrl: env.CDN_BASE_URL })({
          src: image.url,
          width: 512,
        })
      ),
    },
  });
};

export default async function Page({ params: { articleSlug, inStockSlug } }: Props) {
  const article = await getArticleBySlug(articleSlug).then((res) => res as Article);

  const stockIndex = article.stocks.findIndex((stock) => stock.slug === inStockSlug);
  if (stockIndex < 0) return notFound();

  const reviewsSample = await trpc.reviews.findByArticle
    .query({ articleId: article.id, take: 4 })
    .then((res) => res.reviews);

  if (article.stocks.length < stockIndex) throw new Error('Stock index out of range');

  const breadCrumbs = [
    { label: 'Boutique', href: routes().shop().index() },
    { label: article.namePlural, href: routes().shop().article(article.slug).index() },
    { label: article.stocks[stockIndex].title, href: routes().shop().article(article.slug).showInStock(inStockSlug) },
  ];

  return (
    <>
      <div className="flex justify-center mt-8">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
      <WithStructuedDataWrapper
        stucturedData={structuredData.inStockArticle(article, stockIndex, reviewsSample, env.CDN_BASE_URL)}
        as="div"
      >
        <ArticleSection article={article} stockIndex={stockIndex} />
        <SimilarArticlesSection article={article} stockUid={article.stocks[stockIndex].uid} />
        <ArticleDetailsSection article={article} stockIndex={stockIndex} />
        <ReviewsSection articleId={article.id} />
        <ArticleDescritpion article={article} stockIndex={stockIndex} />
        <CustomArticleSection article={article} />
      </WithStructuedDataWrapper>
    </>
  );
}
