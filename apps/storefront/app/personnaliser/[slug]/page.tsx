import { routes } from '@couture-next/routing';
import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import { App } from './app';
import { trpc } from 'apps/storefront/trpc-server';
import { TRPCClientError } from '@trpc/client';
import { notFound } from 'next/navigation';
import { Article } from '@couture-next/types';

type PageProps = {
  params: {
    slug: string;
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

export const generateMetadata = async ({ params }: PageProps) => {
  const article = await getArticleBySlug(params.slug);
  return prepareMetadata({
    title: 'Personnaliser | ' + article.seo.title, // TODO improve with article desc
    alternates: { canonical: routes().shop().customize(params.slug) },
    description:
      'Personnalisez votre ' +
      article.name +
      " à votre image ! Tous les tissus sont certifiés Oeko-Tex 100 et respectueux de l'environnement",
  });
};

export default async function Page({ params }: PageProps) {
  const article = await getArticleBySlug(params.slug);
  return <App article={article as Article} />;
}
