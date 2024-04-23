import { useCart } from 'apps/storefront/contexts/CartContext';

type Props = {
  shippingCost?: number;
  discount?: number;
  giftCardAmount?: number;
};

export default function CartTotal({ shippingCost, discount, giftCardAmount }: Props) {
  const { getCartQuery } = useCart();
  if (!getCartQuery.data) return null;

  return (
    <div className="flex flex-col items-center my-6">
      <div className="space-y-2">
        <h2 className="underline text-center">Récapitulatif</h2>
        <ol className="space-y-2">
          <li className="flex justify-between gap-4">
            <span>Articles:</span>
            <span>{getCartQuery.data.totalTaxIncluded.toFixed(2)} €</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Frais de port:</span>
            <span>{shippingCost?.toFixed(2)} €</span>
          </li>
          {!!discount && (
            <li className="flex justify-between gap-4">
              <span>Remise:</span>
              <span>-{discount.toFixed(2)} €</span>
            </li>
          )}
          {!!giftCardAmount && (
            <li className="flex justify-between gap-4">
              <span>Carte cadeau:</span>
              <span>-{giftCardAmount.toFixed(2)} €</span>
            </li>
          )}
        </ol>
        <p className="text-end font-bold">
          Total: {(getCartQuery.data.totalTaxIncluded + (shippingCost || 0) - (discount || 0)).toFixed(2)} €
        </p>
      </div>
    </div>
  );
}
