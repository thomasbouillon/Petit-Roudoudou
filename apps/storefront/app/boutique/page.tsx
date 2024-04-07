import { Article } from '@couture-next/types';
import { collection, getDocs } from 'firebase/firestore';
import useDatabase from '../../hooks/useDatabase';
import { firestoreConverterAddRemoveId, generateMetadata } from '@couture-next/utils';
import Shop from './Shop';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { StorageImage } from '../StorageImage';

export const metadata = generateMetadata({
  title: 'Boutique',
  alternates: { canonical: routes().shop().index() },
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
      {!customizableOnly && (
        <div className="px-4 mt-8">
          <Link
            className="border rounded-md border-primary-100 p-8 grid md:grid-cols-2 max-w-5xl mx-auto space-y-4"
            href={routes().shop().createGiftCard()}
          >
            <StorageImage
              alt="Un exemple de carte cadeau petit roudoudou"
              src="public/images/gift-card.png"
              className="mx-auto"
              width={350}
              height={165}
            />
            <span>
              Découvre les cartes cadeaux virtuelles Petit Roudoudou pour partager le fait main Français 🇫🇷
              <ul className="list-disc list-inside my-2">
                <li>Personnalise le montant</li>
                <li>Le design de la carte</li>
              </ul>
              Et offre-la à ta famille, tes amis ou collègues !
              <span className="btn-secondary mt-4 mx-auto md:ml-0">Découvrir</span>
            </span>
          </Link>
        </div>
      )}
    </Shop>
  );
}
