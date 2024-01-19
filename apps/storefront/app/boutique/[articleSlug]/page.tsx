import { Article } from '@couture-next/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from '../../../hooks/useDatabase';
import { cache } from 'react';
import Shop from '../Shop';
import { BreadCrumbsNav } from '@couture-next/ui';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

type Props = {
  params: {
    articleSlug: string;
  };
};

export const generateMetadata = async ({ params: { articleSlug } }: Props) => {
  const article = await cachedArticleBySlugFn(articleSlug);

  return {
    title: article.seo.title,
    description: article.seo.description,
  };
};

export default async function Page({ params: { articleSlug } }: Props) {
  const article = await cachedArticleBySlugFn(articleSlug);

  const breadCrumbs = [
    { label: 'Boutique', href: routes().shop().index() },
    { label: article.namePlural, href: routes().shop().article(article.slug).index() },
  ];

  return (
    <Shop articles={[article]} title={'Boutique | ' + article.namePlural}>
      <div className="flex justify-center mt-4">
        <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadCrumbs} />
      </div>
    </Shop>
  );
}

const cachedArticleBySlugFn = cache(async (slug: string) => {
  const snapshot = await getDocs(
    query(collection(firestore, 'articles'), where('slug', '==', slug)).withConverter(
      firestoreConverterAddRemoveId<Article>()
    )
  );
  if (snapshot.empty) throw Error('Not found');
  const article = snapshot.docs[0].data();
  return article;
});
