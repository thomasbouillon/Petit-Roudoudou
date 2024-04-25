import { Article } from '@couture-next/types';
import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import Shop from '../Shop';
import { BreadCrumbsNav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { notFound } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-server';
import { TRPCClientError } from '@trpc/client';

type Props = {
  params: {
    articleSlug: string;
  };
};

export const getArticleBySlug = async (articleSlug: string) => {
  const article = await trpc.articles.findBySlug.query(articleSlug).catch((e) => {
    if (e instanceof TRPCClientError) {
      if (e.data?.code === 'NOT_FOUND') return notFound();
    }
    throw e;
  });
  return article;
};

export const generateMetadata = async ({ params: { articleSlug } }: Props) => {
  const article = await getArticleBySlug(articleSlug);
  return prepareMetadata({
    title: article.seo.title,
    alternates: { canonical: routes().shop().article(article.slug).index() },
    description: article.seo.description,
  });
};

export default async function Page({ params: { articleSlug } }: Props) {
  const article = await getArticleBySlug(articleSlug);

  const breadCrumbs = [
    { label: 'Boutique', href: routes().shop().index() },
    { label: article.namePlural, href: routes().shop().article(article.slug).index() },
  ];

  return (
    <Shop articles={[article as Article]} title={'Boutique | ' + article.namePlural}>
      <div className="flex justify-center mt-4">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
    </Shop>
  );
}
