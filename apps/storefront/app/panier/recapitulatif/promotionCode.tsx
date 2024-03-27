import { CallGetPromotionCodeDiscountPayload, CallGetPromotionCodeDiscountResponse } from '@couture-next/types';
import { ButtonWithLoading } from '@couture-next/ui';
import { useQuery } from '@tanstack/react-query';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { FunctionsErrorCode, httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { FirebaseError } from 'firebase/app';

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  shippingCost: number;
  setDiscountAmount: (amount: number) => void;
};

export default function PromotionCode({ setValue, shippingCost, watch, setDiscountAmount }: Props) {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const functions = useFunctions();

  const discountQueryFn = useCallback(
    (payload: CallGetPromotionCodeDiscountPayload) => {
      const fn = httpsCallable<CallGetPromotionCodeDiscountPayload, CallGetPromotionCodeDiscountResponse>(
        functions,
        'callGetPromotionCodeDiscount'
      );
      setError(undefined);
      return fn(payload).catch((e) => {
        if (e instanceof FirebaseError && e.code === ('functions/not-found' satisfies FunctionsErrorCode)) {
          setError('Code promotionnel invalide');
          return null;
        } else {
          throw e;
        }
      });
    },
    [functions, setError]
  );

  const discountQuery = useQuery({
    queryKey: ['discount', code],
    queryFn: () => discountQueryFn({ code, shippingCost, extras: watch('extras') }),
    enabled: code.length > 0,
  });

  const apply = useCallback(() => {
    setCode(inputRef.current?.value ?? '');
  }, [setCode, inputRef.current]);

  useEffect(() => {
    if (discountQuery.data?.data?.amount !== undefined) {
      setDiscountAmount(discountQuery.data.data.amount);
      setValue('promotionCode', code);
    } else {
      setDiscountAmount(0);
      setValue('promotionCode', undefined);
    }
  }, [discountQuery.isLoading]);

  return (
    <div className="mt-4">
      <h2 className="text-center underline">Un code promo ?</h2>
      <div className="flex mt-2 items-center">
        <input
          type="text"
          aria-label="Code promo"
          className="border p-2 w-full"
          ref={inputRef}
          onKeyUp={(e) => e.key === 'Enter' && apply()}
        />
        <ButtonWithLoading className="btn-light p-2" type="button" onClick={apply} loading={discountQuery.isFetching}>
          Appliquer
        </ButtonWithLoading>
      </div>
      {error && <p className="text-center mt-2 text-red-500">{error}</p>}
      {discountQuery.data && <p className="text-center mt-2">- {discountQuery.data?.data?.amount.toFixed(2)} €</p>}
    </div>
  );
}
