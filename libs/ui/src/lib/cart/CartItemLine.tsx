import Image, { ImageLoader } from 'next/image';
import type { CartItem } from '@couture-next/types';

export const CartItemLine: React.FC<{
  item: CartItem;
  imageLoader?: ImageLoader;
}> = ({ item, imageLoader }) => (
  <div className="flex sm:flex-row flex-col gap-4 space-y-4">
    <div className="w-full">
      <Image
        src={item.image.url}
        placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
        blurDataURL={item.image.placeholderDataUrl}
        alt=""
        width={256}
        height={256}
        loader={imageLoader}
        className="w-64 h-64 object-contain object-center"
      />
    </div>
    <div className="flex flex-col justify-center w-full items-center sm:items-end">
      <h2>{item.description}</h2>
      <ul className="empty:hidden">
        {Object.values(item.customizations ?? {})
          .filter((customized) => customized.type !== 'fabric' && customized.value !== '')
          .map((customized) => (
            <li>
              {customized.title}:{' '}
              {customized.type === 'boolean' ? (customized.value ? 'Oui' : 'Non') : customized.value}
            </li>
          ))}
      </ul>
      <p className="font-bold">
        <span className="sr-only">Prix:</span>
        {item.totalTaxIncluded.toFixed(2)}€
      </p>
    </div>
  </div>
);
