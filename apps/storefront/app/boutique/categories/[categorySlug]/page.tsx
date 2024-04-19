import { Article } from '@couture-next/types';
import { generateMetadata as prepareMetadata } from '@couture-next/utils';
import Shop from '../../Shop';
import { BreadCrumbsNav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { notFound } from 'next/navigation';
import { trpc } from 'apps/storefront/trpc-server';

type Props = {
  params: {
    categorySlug: string;
  };
};

export const getGroupBySlug = async (categorySlug: string) => {
  const group = await trpc.articleGroups.findBySlug.query(categorySlug).catch((e) => {
    if (e.code === 'NOT_FOUND') return notFound();
    throw e;
  });
  return group;
};

export const generateMetadata = async ({ params: { categorySlug } }: Props) => {
  const group = await getGroupBySlug(categorySlug);
  return prepareMetadata({
    title: group.name,
    alternates: { canonical: routes().shop().group(group.slug).index() },
    description: 'Découvrez tous les articles de notre catégorie ' + group.name + ' !',
  });
};

export default async function Page({ params: { categorySlug } }: Props) {
  const group = await getGroupBySlug(categorySlug);

  const breadCrumbs = [
    { label: 'Boutique', href: routes().shop().index() },
    { label: group.name, href: routes().shop().group(group.slug).index() },
  ];

  return (
    <Shop articles={group.articles as Article[]} title={'Boutique | ' + group.name}>
      <div className="flex justify-center mt-4">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
    </Shop>
  );
}
