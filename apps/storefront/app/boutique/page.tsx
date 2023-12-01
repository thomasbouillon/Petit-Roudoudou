import { Article } from '@couture-next/types';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import useDatabase from '../../hooks/useDatabase';
import {
  firestoreConverterAddRemoveId,
  generateMetadata,
} from '@couture-next/utils';
import Shop from './Shop';

export const metadata = generateMetadata({
  title: 'Boutique',
  description:
    'Venez découvrir tous les créations made in France 100% personnalisables ! Couvertures, Gigoteuses, Doudous, Bavoirs, tout est cousu à la main avec passion !',
});

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: Props) {
  const db = useDatabase();

  const collectionRef = collection(db, 'articles').withConverter(
    firestoreConverterAddRemoveId<Article>()
  );

  const fetchArticles = () =>
    searchParams.type
      ? // Filter articles by type
        Promise.all(
          (typeof searchParams.type === 'string'
            ? [searchParams.type]
            : searchParams.type
          ).map((filteredTypeId) =>
            getDoc(doc(collectionRef, filteredTypeId)).then((snapshot) =>
              snapshot.data()
            )
          )
        )
      : // All articles
        getDocs(collectionRef).then((snapshot) =>
          snapshot.docs.map((doc) => doc.data())
        );

  const articles = (await fetchArticles().then((articles) =>
    articles.filter(Boolean)
  )) as NonNullable<Awaited<ReturnType<typeof fetchArticles>>[0]>[];

  return <Shop articles={articles} />;
}
