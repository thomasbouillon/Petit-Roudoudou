import { UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import DetailsFormFields from './detailsFormFields';
import { useEffect } from 'react';

type Props = {
  register: UseFormRegister<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  setValue: UseFormSetValue<FinalizeFormType>;
  cartWeight?: number;
};

export default function Billing({ setValue, register, watch, cartWeight }: Props) {
  useEffect(() => {
    // Force prompt of billing infos if shipping method is pickup-at-workshop or cart contains only digital items
    if ((watch('shipping.method') === 'pickup-at-workshop' || cartWeight === 0) && watch('billing') === null) {
      setValue('billing', undefined, { shouldValidate: true });
    }
  }, [watch('shipping.method'), cartWeight]);

  return (
    <div className="w-full">
      <h2 className="text-center underline">Adresse de facturation</h2>
      {watch('shipping.method') !== 'pickup-at-workshop' && !!cartWeight && (
        <div className="flex gap-2 mt-4">
          <label htmlFor="sameAsShipping">
            Réutiliser l'adresse précedente <span className="sr-only">({watch('shipping.address')})</span>
          </label>
          <input
            id="sameAsShipping"
            defaultChecked={watch('billing') === null}
            onChange={() => {
              if (watch('billing') === null) {
                setValue('billing', undefined, { shouldValidate: true });
              } else {
                setValue('billing', null, { shouldValidate: true });
              }
            }}
            type="checkbox"
          />
        </div>
      )}
      {watch('billing') !== null && (
        <DetailsFormFields register={register} baseFieldPath="billing" variant="with-country" />
      )}
    </div>
  );
}
