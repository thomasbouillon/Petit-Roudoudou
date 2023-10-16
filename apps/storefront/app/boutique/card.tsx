import Image from 'next/image';
import Link from 'next/link';

type Props = {
  title: string;
  description: string;
  characteristics?: [string, string][];
  image: string;
  stock?: number;
  price: number;
};

export default function Card({
  title,
  characteristics,
  description,
  stock,
  price,
  image,
}: Props) {
  const [units, cents] = [
    Math.floor(price).toString().padStart(2, '0'),
    Math.floor((price - Math.floor(price)) * 100)
      .toString()
      .padStart(2, '0'),
  ];

  return (
    <>
      <div className="flex flex-col items-center rounded-lg">
        <div className="w-72 h-72 bg-white shadow-lg">
          <Image
            src={image}
            alt=""
            className="w-full h-full object-cover"
            width={288}
            height={288}
          />
        </div>
        <div className="w-72 bg-white shadow-lg mb-3">
          <div className="px-4">
            <h3 className="text-2xl font-serif mt-2">{title}</h3>
            {!!characteristics && (
              <ul>
                {characteristics.map(([label, value]) => (
                  <li key={label}>
                    {label}: <span className="font-bold">{value}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 mb-3 line-clamp-6">{description}</p>
            <div className="flex justify-between">
              <p className="sr-only">Prix: {price}</p>
              <p className="font-bold relative text-xs mr-2" aria-hidden>
                <span className="text-3xl">{units}</span>.{cents}
                <span className="top-0 absolute">€</span>
              </p>
              {stock !== undefined && (
                <p className="mt-auto text-primary-100">
                  Plus que 1 en stock !
                </p>
              )}
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
