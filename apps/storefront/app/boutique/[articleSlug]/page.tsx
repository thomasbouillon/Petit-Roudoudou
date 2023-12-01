import { Article } from '@couture-next/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from '../../../hooks/useDatabase';
import { cache } from 'react';
import Shop from '../Shop';

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
    // TODO getStructuredData
  };
};

export default async function Page({ params: { articleSlug } }: Props) {
  const article = await cachedArticleBySlugFn(articleSlug);
  return (
    <Shop
      articles={[article]}
      disableFilters
      title={'Boutique | ' + article.namePlural}
    />
  );
}

const cachedArticleBySlugFn = cache(async (slug: string) => {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'articles'),
      where('slug', '==', slug)
    ).withConverter(firestoreConverterAddRemoveId<Article>())
  );
  if (snapshot.empty) throw Error('Not found');
  const article = snapshot.docs[0].data();
  return article;
});
