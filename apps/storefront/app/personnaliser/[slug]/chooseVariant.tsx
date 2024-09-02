'use client';

import { Article } from '@couture-next/types';
import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';

const getVariantPrices = (customizableVariant: Article['customizableVariants'][number], skus: Article['skus']) => {
  let low = Infinity;
  const prices = new Set<number>();
  for (const sku of skus) {
    if (sku.customizableVariantUid === customizableVariant.uid) {
      prices.add(sku.price);
      low = Math.min(low, sku.price);
    }
  }
  return { low, prices };
};

export default function ChooseVariant({ article, nextStep }: { article: Article; nextStep: string }) {
  const allowedValues = useMemo(
    () =>
      article.customizableVariants.filter((variant) =>
        article.skus.some((sku) => sku.customizableVariantUid === variant.uid)
      ),
    [article]
  );

  const searchParams = useSearchParams();
  const selectedVariant = searchParams.get('variant');

  const { setValue: setFormValue } = useFormContext();

  const router = useRouter();
  const setValue = useCallback(
    (value: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', value);
      url.searchParams.set('step', nextStep);
      if (allowedValues.length === 1) router.replace(url.toString());
      else router.push(url.toString());
      setFormValue('customizables', {});
    },
    [searchParams, router, nextStep]
  );

  useEffect(() => {
    if (allowedValues.length === 1 && !selectedVariant) {
      setValue(allowedValues[0].uid);
    }
  }, [allowedValues, selectedVariant, setValue]);

  const variantsShareSamePrice = useMemo(() => {
    if (allowedValues.length === 0) return true;
    const { prices } = getVariantPrices(allowedValues[0], article.skus);
    for (let i = 1; i < allowedValues.length; i++) {
      const { prices: prices2 } = getVariantPrices(allowedValues[i], article.skus);
      const pricesMatch = prices.size === prices2.size && [...prices].every((value) => prices2.has(value));
      if (!pricesMatch) {
        return false;
      }
    }
    return true;
  }, [article.skus, allowedValues]);

  if (allowedValues.length === 0) {
    toast.error('Impossible de déterminer la selection de modèles 3D à afficher.');
    return null;
  }

  return (
    <RadioGroup value={selectedVariant} onChange={setValue} className="mt-8 flex flex-wrap justify-center gap-4">
      <Label className="block mb-6 text-center font-serif text-3xl basis-full">Je choisis mon assemblage</Label>
      {variantsShareSamePrice && <p className="w-full text-center">Le prix ne varie pas d'un assemblage à l'autre</p>}
      {allowedValues.map((variant) => (
        <Radio key={variant.uid} value={variant.uid} className="basis-64 cursor-pointer">
          <Image
            src={variant.image.url}
            alt={variant.name}
            loader={loader}
            width={256}
            height={256}
            className="w-64 h-64 object-contain mx-auto"
          />
          <Description className="text-center font-bold">{variant.name}</Description>
          {!variantsShareSamePrice && (
            <Description className="text-center">
              A partir de {getVariantPrices(variant, article.skus).low.toFixed(2)} €
            </Description>
          )}
          <span className="btn-secondary mx-auto mt-4" aria-hidden>
            Choisir
          </span>
        </Radio>
      ))}
    </RadioGroup>
  );
}
