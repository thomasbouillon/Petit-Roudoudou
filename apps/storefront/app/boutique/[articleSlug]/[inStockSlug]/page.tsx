import { Article } from '@couture-next/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from '../../../../hooks/useDatabase';
import { firebaseServerImageLoader as loader, generateMetadata as prepareMetadata } from '@couture-next/utils';
import { notFound } from 'next/navigation';
import ArticleSection from './ArticleSection';
import SimilarArticlesSection from './SimilarArticlesSection';
import CustomArticleSection from './CustomArticleSection';
import ReviewsSection from './ReviewsSections';
import { BreadCrumbsNav, WithStructuedDataWrapper } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';
import env from '../../../../env';
import ArticleDetailsSection from './ArticleDetailsSection';

type Props = {
  params: {
    articleSlug: string;
    inStockSlug: string;
  };
};

export const generateMetadata = async ({ params: { articleSlug, inStockSlug } }: Props) => {
  const article = await articleBySlugFn(articleSlug);
  const stockIndex = article.stocks.findIndex((stock) => stock.slug === inStockSlug);

  return prepareMetadata({
    title: article.stocks[stockIndex].title,
    alternates: { canonical: routes().shop().article(article.slug).showInStock(inStockSlug) },
    description: article.stocks[stockIndex].seo.description,
    openGraph: {
      locale: 'fr_FR',
      url: routes().shop().article(articleSlug).showInStock(inStockSlug),
      siteName: 'Petit Roudoudou',
      title: article.stocks[stockIndex].title,
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
  const article = await articleBySlugFn(articleSlug);
  const stockIndex = article.stocks.findIndex((stock) => stock.slug === inStockSlug);

  if (stockIndex < 0) return notFound();
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
        stucturedData={structuredData.inStockArticle(article, stockIndex, env.CDN_BASE_URL)}
        as="div"
      >
        <ArticleSection article={article} stockIndex={stockIndex} />
        <SimilarArticlesSection article={article} stockIndex={stockIndex} />
        <ArticleDetailsSection article={article} stockIndex={stockIndex} />
        <ReviewsSection articleId={article._id} />
        <CustomArticleSection article={article} stockIndex={stockIndex} />
      </WithStructuedDataWrapper>
    </>
  );
}

const articleBySlugFn = async (slug: string) => {
  const snapshot = await getDocs(
    query(collection(firestore, 'articles'), where('slug', '==', slug)).withConverter(
      firestoreConverterAddRemoveId<Article>()
    )
  );
  if (snapshot.empty) throw Error('Not found');
  const article = snapshot.docs[0].data();
  return article;
};
