import { useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import DetailsFormFields from './detailsFormFields';
import { useEffect } from 'react';

type Props = {
  cartWeight?: number;
};

export default function Billing({ cartWeight }: Props) {
  const { setValue } = useFormContext<FinalizeFormType>();

  const deliveryMode = useWatch<FinalizeFormType, 'shipping.deliveryMode'>({ name: 'shipping.deliveryMode' });
  const billing = useWatch<FinalizeFormType, 'billing'>({ name: 'billing' });
  const shippingAddress = useWatch<FinalizeFormType, 'shipping.address'>({ name: 'shipping.address' });

  console.log(billing);

  useEffect(() => {
    // Force prompt of billing infos if shipping method is pickup-at-workshop or cart contains only digital items
    if ((deliveryMode === 'pickup-at-workshop' || cartWeight === 0) && billing === null) {
      setValue('billing', undefined, { shouldValidate: true });
    }
  }, [deliveryMode, cartWeight]);

  return (
    <div className="w-full">
      <h2 className="text-center underline">Adresse de facturation</h2>
      {deliveryMode !== 'pickup-at-workshop' && !!cartWeight && (
        <div className="flex gap-2 mt-4">
          <label htmlFor="sameAsShipping">
            Réutiliser l'adresse précedente <span className="sr-only">({shippingAddress})</span>
          </label>
          <input
            id="sameAsShipping"
            defaultChecked={billing === null}
            onChange={() => {
              if (billing === null) {
                setValue('billing', undefined, { shouldValidate: true });
              } else {
                setValue('billing', null, { shouldValidate: true });
              }
            }}
            type="checkbox"
          />
        </div>
      )}
      {billing !== null && <DetailsFormFields baseFieldPath="billing" variant="with-country" />}
    </div>
  );
}
