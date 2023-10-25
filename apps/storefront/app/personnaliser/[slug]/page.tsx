'use client';

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import useArticle from '../../../hooks/useArticle';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import ChooseSKU from './chooseSKU';
import ChooseOptions from './chooseOptions';
import { useCart } from '../../../contexts/CartContext';
import { ButtonWithLoading } from '@couture-next/ui';

export default function Page() {
  const routeParams = useParams();
  const queryParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [step, setStep] = useState<'chooseSKU' | 'chooseOptions' | 'recap'>(
    'chooseSKU'
  );
  const [sku, setSku] = useState<string | null>(queryParams.get('sku'));
  const { query } = useArticle({ slug: routeParams.slug });
  const [customizations, setCustomizations] = useState<Record<string, unknown>>(
    {}
  );

  const handleSKUSelected = useCallback(
    (skuId: string) => {
      setSku(skuId);
      setStep('chooseOptions');
      const params = new URLSearchParams(queryParams.toString());
      params.set('sku', skuId);
      router.push(pathname + '?' + params.toString());
    },
    [queryParams, pathname, router]
  );

  const { addToCartMutation } = useCart();
  const handleFabricsCustomizationFinished = useCallback(
    async (data: Record<string, unknown>) => {
      setCustomizations(data);
      console.log('set', data);
      setStep('recap');
    },
    [setCustomizations]
  );

  const handleAddToCart = useCallback(async () => {
    console.log(query.isError, query.isLoading, sku);
    if (query.isError || query.isLoading || !sku) throw 'Impossible';
    console.log(customizations);

    await addToCartMutation.mutateAsync({
      articleId: query.data._id,
      customizations,
      skuId: sku,
    });
  }, []);

  if (query.isError) throw query.error;
  if (query.isLoading) return null;

  const article = query.data;

  return (
    <div>
      <h1 className="font-serif font-bold text-4xl text-center mb-4 mt-8">
        Personnaliser sa couverture
      </h1>
      <Image
        src={article.images[0].url}
        alt=""
        width={256}
        height={256}
        className="w-64 h-64 object-contain mx-auto mb-6"
      />
      <div className="flex justify-center">
        <div className="max-w-3xl w-full">
          {step === 'chooseSKU' && (
            <ChooseSKU article={article} onSKUSelected={handleSKUSelected} />
          )}
          {step === 'chooseOptions' && (
            <ChooseOptions
              className="mt-6"
              article={article}
              onFabricsCustomizationFinished={
                handleFabricsCustomizationFinished
              }
            />
          )}
          {step === 'recap' && (
            <ButtonWithLoading
              className="btn-primary mx-auto"
              onClick={handleAddToCart}
              loading={addToCartMutation.isLoading}
            >
              Ajouter au panier
            </ButtonWithLoading>
          )}
        </div>
      </div>
    </div>
  );
}
