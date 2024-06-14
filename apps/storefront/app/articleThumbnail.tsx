import { PrettyPrice } from '@couture-next/ui/PrettyPrice';
import Link from 'next/link';
import clsx from 'clsx';
import { StorageImage } from './StorageImage';

type Props = {
  title: string;
  image: string;
  placeholderDataUrl?: string;
  price: number;
  buttonLabel: string;
  buttonLink: string;
  variant?: 'default' | 'customizable-article';
};

export default function ArticleThumbnail({
  title,
  price,
  image,
  placeholderDataUrl,
  buttonLabel,
  buttonLink,
  variant = 'default',
}: Props) {
  return (
    <div className="flex flex-col relative basis-96">
      <div className="bg-white rounded-t-sm overflow-hidden">
        <StorageImage
          src={image}
          alt=""
          className="w-full h-full object-cover aspect-[380/230]"
          width={384}
          height={230}
          placeholder={placeholderDataUrl ? 'blur' : 'empty'}
          blurDataURL={placeholderDataUrl}
        />
      </div>
      <div className="shadow-lg mb-4 bg-white rounded-b-md flex-grow px-4 flex flex-col">
        <div className="flex flex-col justify-between flex-grow">
          <h3 className="text-2xl font-serif pt-2 text-center mb-4">
            {title}
            {variant === 'customizable-article' && <span className="text-primary-100"> à personnaliser</span>}
          </h3>
          <div
            className={clsx(
              'flex items-end gap-2',
              variant === 'customizable-article' ? 'justify-between' : 'justify-center'
            )}
          >
            {variant === 'customizable-article' && <p className="text-primary-100 font-bold">À partir de</p>}
            <PrettyPrice price={price} currencySize="big" />
          </div>
        </div>
        <Link
          className={clsx(
            'min-w-[80%] mx-auto block text-center mt-auto translate-y-4 !p-2',
            variant === 'customizable-article' && 'btn-light bg-white border-2 border-current',
            variant === 'default' && 'btn-primary'
          )}
          href={buttonLink}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
