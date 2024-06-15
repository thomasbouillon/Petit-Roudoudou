import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { trpc } from 'apps/storefront/trpc-client';
import { TRPCClientErrorLike } from '@trpc/client';

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  shippingCost: number;
  setDiscountAmount: (amount: number) => void;
};

function errorStrFromTrpcError(error: TRPCClientErrorLike<any>): string {
  return error.data.code === 'BAD_REQUEST' ? 'Code promotionnel invalide' : 'Erreur inconnue';
}

export default function PromotionCode({ setValue, shippingCost, watch, setDiscountAmount }: Props) {
  const [code, setCode] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const discountQuery = trpc.promotionCodes.getDiscountForCart.useQuery(
    {
      code,
      extras: {
        reduceManufacturingTimes: watch('extras.reduceManufacturingTimes'),
      },
      shippingCost,
    },
    { enabled: code.length > 0 }
  );

  const apply = useCallback(() => {
    setCode(inputRef.current?.value ?? '');
  }, [setCode, inputRef.current]);

  useEffect(() => {
    if (discountQuery.data !== undefined) {
      setDiscountAmount(discountQuery.data.amount);
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
        />
        <ButtonWithLoading className="btn-light p-2" type="button" onClick={apply} loading={discountQuery.isFetching}>
          Appliquer
        </ButtonWithLoading>
      </div>
      {discountQuery.isError && (
        <p className="text-center mt-2 text-red-500">{errorStrFromTrpcError(discountQuery.error)}</p>
      )}
      {discountQuery.data && <p className="text-center mt-2">- {discountQuery.data.amount?.toFixed(2)} €</p>}
    </div>
  );
}
