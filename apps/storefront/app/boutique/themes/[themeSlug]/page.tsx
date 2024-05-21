import { Article } from '@couture-next/types';
import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import { BreadCrumbsNav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { notFound } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-server';
import Shop from '../../[articleSlug]/Shop';

type Props = {
  params: {
    themeSlug: string;
  };
};

const getThemeBySlug = async (themeSlug: string) => {
  const theme = await trpc.articleThemes.findBySlug.query(themeSlug).catch((e) => {
    if (e.code === 'NOT_FOUND') return notFound();
    throw e;
  });
  return theme;
};

export const generateMetadata = async ({ params: { themeSlug } }: Props) => {
  const theme = await getThemeBySlug(themeSlug);
  return prepareMetadata({
    title: theme.name,
    alternates: { canonical: routes().shop().theme(theme.slug).index() },
    description: 'Découvrez tous les articles de notre catégorie ' + theme.name + ' !',
  });
};

export default async function Page({ params: { themeSlug } }: Props) {
  const theme = await getThemeBySlug(themeSlug);

  const breadCrumbs = [
    { label: 'Boutique', href: routes().shop().index() },
    { label: theme.name, href: routes().shop().theme(theme.slug).index() },
  ];

  return (
    <Shop articles={theme.articles as Article[]} title={'Boutique | ' + theme.name}>
      <div className="flex justify-center mt-4">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
    </Shop>
  );
}
