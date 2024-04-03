import { Article } from '@couture-next/types';
import { collection, getDocs } from 'firebase/firestore';
import useDatabase from '../../hooks/useDatabase';
import { firestoreConverterAddRemoveId, generateMetadata } from '@couture-next/utils';
import Shop from './Shop';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export const metadata = generateMetadata({
  title: 'Boutique',
  description:
    'Venez découvrir tous les créations made in France 100% personnalisables ! Couvertures, Gigoteuses, Doudous, Bavoirs, tout est cousu à la main avec passion !',
});

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: Props) {
  const db = useDatabase();

  const customizableOnly = 'customizableOnly' in searchParams && searchParams.customizableOnly === 'true';

  const collectionRef = collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>());

  const fetchArticles = () => getDocs(collectionRef).then((snapshot) => snapshot.docs.map((doc) => doc.data()));

  const articles = await fetchArticles();

  return (
    <Shop articles={articles} appendArticleStocks={!customizableOnly}>
      <nav
        aria-label="Navigation parmis les articles"
        className="flex flex-wrap max-w-prose mx-auto justify-center mt-4"
      >
        <ul className="flex flex-wrap gap-2 empty:hidden justify-center max-w-prose">
          {articles.map((article) => (
            <li className="relative pr-5 !outline-none border rounded-full" key={article._id}>
              <Link href={routes().shop().article(article.slug).index()} className="w-full block px-4 py-2">
                {article.namePlural}
                <ArrowTopRightOnSquareIcon className="inline-block w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Shop>
  );
}
