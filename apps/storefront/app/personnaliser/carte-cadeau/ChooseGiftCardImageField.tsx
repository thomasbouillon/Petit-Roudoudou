import { Controller, useFormState } from 'react-hook-form';
import { CustomizeGiftCardFormValues } from './CustomizeGiftCardForm';
import { useEffect, useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import env from '../../../env';

const getUrl = (pathname: string) => new URL(pathname, env.CDN_BASE_URL).toString();

export function ChooseGiftCardImageField() {
  const [images, setImages] = useState([] as { img: HTMLImageElement; label: string }[]);
  const { errors } = useFormState<CustomizeGiftCardFormValues>({ name: 'image' });

  useEffect(() => {
    Promise.all(
      [
        [getUrl('/public/images/teddy-bear.svg'), 'Ourson'],
        [getUrl('/public/images/pragnent.svg'), 'Femme enceinte'],
        [getUrl('/public/images/tree.svg'), 'Arbre de noël'],
        [getUrl('/public/images/gift.svg'), 'Cadeau'],
      ].map(
        ([imageSrc, label]) =>
          new Promise<(typeof images)[number]>((resolve) => {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
              resolve({ img, label });
            };
          })
      )
    ).then(setImages);
  }, []);

  return (
    <>
      <Controller<CustomizeGiftCardFormValues>
        name="image"
        render={({ field }) => (
          <RadioGroup<'div', HTMLImageElement> value={field.value} onChange={field.onChange} className="mt-2">
            <RadioGroup.Label>Image</RadioGroup.Label>
            <div className="grid grid-cols-4 gap-4">
              {images.map(({ img, label }) => (
                <RadioGroup.Option
                  key={label}
                  value={img}
                  className="flex flex-col items-center ui-checked:ring ring-primary-100 p-2 !outline-none"
                >
                  <img src={img.src} alt={label} className="w-20 h-20" />
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        )}
      />
      <small className="text-red-500">{errors.image?.message?.toString()}</small>
    </>
  );
}
