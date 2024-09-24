import Image, { ImageLoader } from 'next/image';
import type { CartItemWithTotal } from '@couture-next/types';

export const CartItemLine: React.FC<{
  item: CartItemWithTotal;
  imageLoader?: ImageLoader;
  renderQuantityWidget?: (item: CartItemWithTotal) => JSX.Element;
}> = ({ item, imageLoader, renderQuantityWidget }) => (
  <div className="flex sm:flex-row flex-col gap-4 space-y-4">
    <div className="w-full">
      <Image
        src={item.image.url}
        placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
        blurDataURL={item.image.placeholderDataUrl ?? undefined}
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
          .filter(
            (customized) => customized.type !== 'fabric' && customized.type !== 'piping' && customized.value !== ''
          )
          .map((customized) => (
            <li key={customized.title}>
              {customized.title}:{' '}
              {customized.displayValue ??
                (typeof customized.value === 'string' ? customized.value : customized.value ? 'Oui' : 'Non')}
            </li>
          ))}
      </ul>
      {!!renderQuantityWidget && renderQuantityWidget(item)}
      <p className="font-bold">
        <span className="sr-only">Prix:</span>
        {item.totalTaxIncluded.toFixed(2)}€
      </p>
    </div>
  </div>
);
