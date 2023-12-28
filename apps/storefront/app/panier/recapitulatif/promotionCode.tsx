import { CallGetPromotionCodeDiscountPayload, CallGetPromotionCodeDiscountResponse } from '@couture-next/types';
import { ButtonWithLoading } from '@couture-next/ui';
import { useQuery } from '@tanstack/react-query';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  shippingCost: number;
};

export default function PromotionCode({ setValue, shippingCost, watch }: Props) {
  const [code, setCode] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const functions = useFunctions();
  const discountQueryFn = useMemo(
    () =>
      httpsCallable<CallGetPromotionCodeDiscountPayload, CallGetPromotionCodeDiscountResponse>(
        functions,
        'callGetPromotionCodeDiscount'
      ),
    [functions]
  );
  const discountQuery = useQuery({
    queryKey: ['discount', code],
    queryFn: () => discountQueryFn({ code, shippingCost, extras: watch('extras') }),
    enabled: code.length > 0,
  });
  if (discountQuery.isError) throw discountQuery.error;

  const apply = useCallback(() => {
    setCode(inputRef.current?.value ?? '');
  }, [setCode, inputRef.current]);

  useEffect(() => {
    setValue('promotionCode', discountQuery.data?.data?.amount === undefined ? undefined : code);
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
      {discountQuery.data && <p className="text-center mt-2">- {discountQuery.data?.data?.amount.toFixed(2)} €</p>}
    </div>
  );
}
