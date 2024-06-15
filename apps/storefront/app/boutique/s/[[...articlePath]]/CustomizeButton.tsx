import { routes } from '@couture-next/routing';
import { Article } from '@couture-next/types';
import Link from 'next/link';

type Props = {
  articles: Article[];
};

export default function CustomizeButton({ articles }: Props) {
  // TODO improve with 3D video

  if (articles.length === 0) return null;

  return (
    <Link href={routes().shop().customize(articles[0].slug)} className="btn-primary mx-auto">
      Je réalise sur mesure
    </Link>
  );
}
