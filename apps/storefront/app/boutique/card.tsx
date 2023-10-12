import { Article } from '@couture-next/types';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  article: Article;
};

export default function Card({ article }: Props) {
  const price = 10.99;
  const [units, cents] = [
    Math.ceil(price).toString().padStart(2, '0'),
    Math.ceil((price - Math.ceil(price)) * 100)
      .toString()
      .padStart(2, '0'),
  ];

  return (
    <>
      <div className="flex flex-col items-center rounded-lg">
        <div className="w-72 h-72 bg-white shadow-lg">
          <Image
            src={article.images[0]}
            alt=""
            className="w-full h-full object-cover"
            width={288}
            height={288}
          />
        </div>
        <div className="w-72 bg-white shadow-lg mb-3">
          <div className="px-4">
            <h3 className="text-2xl font-serif mt-2">{article.name}</h3>
            <p className="mt-1 mb-3">{article.description}</p>
            <div className="flex justify-between">
              <p className="sr-only">Prix: {price}</p>
              <p className="font-bold relative text-xs mr-2" aria-hidden>
                <span className="text-3xl">{units}</span>.{cents}
                <span className="top-0 absolute">€</span>
              </p>
              <p className="mt-auto text-primary-100">Plus que 1 en stock !</p>
            </div>
            <Link
              className="btn-primary w-4/5 mx-auto translate-y-4 block text-center"
              href="#"
            >
              Personnaliser
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
