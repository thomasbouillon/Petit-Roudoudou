import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import { explodeShopArticlePath, routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-server';
import Link from 'next/link';
import { Article } from '@couture-next/types';
import Results from './Results';
import Filters from './Filters';
import CustomizeButton from './CustomizeButton';
import { BreadCrumbsNav } from '@couture-next/ui';

export const generateMetadata = async (props: Props) => {
  const { articles, pageTitle, kind, seo } = await fetchUniformized(props);

  if (kind === 'article') {
    if (!seo) throw new Error('Missing seo definition');
    return prepareMetadata({
      title: seo.title,
      alternates: { canonical: routes().shop().article(articles[0].slug).index() },
      description: seo.description,
    });
  }

  if (kind === 'articleTheme') {
    if (!seo) console.warn('Missing theme seo definition');
    const themeId = articles[0].themeId;
    const theme = themeId ? await trpc.articleThemes.findById.query(themeId) : null;
    return prepareMetadata({
      title: seo?.title ?? pageTitle,
      alternates: {
        canonical: routes()
          .shop()
          .theme(theme?.slug || pageTitle)
          .index(),
      },
      description: seo?.description ?? `Découvrez tous les articles du thème ${pageTitle}`,
    });
  }

  throw new Error('Invalid kind');
};

type Props = {
  params: {
    articlePath?: string[];
  };
};

async function fetchUniformized({ params }: Props): Promise<{
  articles: Article[];
  pageTitle: string;
  kind: 'article' | 'articleTheme';
  seo: { title: string; description: string } | null;
}> {
  const parsed = explodeShopArticlePath(params.articlePath);

  if (parsed === null) throw new Error('Invalid article path');
  if (parsed.discriminator === 't') {
    const theme = await trpc.articleThemes.findBySlug.query(parsed.slug);
    return { articles: theme.articles as Article[], pageTitle: theme.name, kind: 'articleTheme', seo: theme.seo };
  }
  if (parsed.discriminator === 'a') {
    const article = await trpc.articles.findBySlug.query(parsed.slug);
    return { articles: [article] as Article[], pageTitle: article.namePlural, kind: 'article', seo: article.seo };
  }
  throw new Error('Invalid kind');
}

export default async function Page({ params }: Props) {
  const { articles, pageTitle, kind } = await fetchUniformized({ params });

  const breadCrumbs = [
    {
      label: 'Boutique',
      href: routes().shop().index(),
    },
  ];

  if (kind === 'articleTheme') {
    const themeId = articles[0].themeId;
    const theme = themeId ? await trpc.articleThemes.findById.query(themeId) : null;
    if (theme) {
      breadCrumbs.push({
        label: theme.name,
        href: routes().shop().theme(theme.slug).index(),
      });
    }
  } else if (kind === 'article') {
    if (articles[0].themeId) {
      const theme = await trpc.articleThemes.findById.query(articles[0].themeId);
      breadCrumbs.push({
        label: theme.name,
        href: routes().shop().theme(theme.slug).index(),
      });
    }
    breadCrumbs.push({
      label: pageTitle,
      href: routes().shop().article(articles[0].slug).index(),
    });
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-4 my-6">
        <h1 className="font-serif text-3xl text-center">{pageTitle}</h1>
        <div className="max-w-[68rem] w-full mx-auto">
          <BreadCrumbsNav items={breadCrumbs} Link={Link} ariaLabel="Navigation dans la boutique" />
        </div>
      </div>
      <div className="mb-6">
        <Filters />
      </div>
      {kind !== 'articleTheme' && <CustomizeButton articles={articles} />}
      <div className="lg:max-w-[72rem] mx-auto">
        <Results articles={articles as Article[]} useCarousels={kind === 'articleTheme'} />
      </div>
    </>
  );
}
