'use client';

import { ButtonWithLoading } from '@couture-next/ui';
import { useCart } from '../../../../contexts/CartContext';
import { CallAddToCartMutationPayload } from '@couture-next/types';

export default function AddToCartButton({
  payload,
}: {
  payload: CallAddToCartMutationPayload & { type: 'add-in-stock-item' };
}) {
  const { addToCartMutation } = useCart();

  const addToCart = async () => {
    await addToCartMutation.mutateAsync(payload);
  };

  return (
    <ButtonWithLoading
      loading={addToCartMutation.isPending}
      disabled={addToCartMutation.isPending}
      className="btn btn-primary mx-auto mt-16"
      onClick={addToCart}
    >
      Ajouter au panier
    </ButtonWithLoading>
  );
}
