import { UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import DetailsFormFields from './detailsFormFields';
import { useEffect } from 'react';

type Props = {
  register: UseFormRegister<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  setValue: UseFormSetValue<FinalizeFormType>;
};

export default function Billing({ setValue, register, watch }: Props) {
  useEffect(() => {
    // Force prompt of billing infos if shipping method is pickup-at-workshop
    if (watch('shipping.method') === 'pickup-at-workshop' && watch('billing') === null) {
      setValue('billing', undefined, { shouldValidate: true });
    }
  }, [watch('shipping.method')]);

  return (
    <div className="w-full">
      <h2 className="text-center underline">Adresse de facturation</h2>
      {watch('shipping.method') !== 'pickup-at-workshop' && (
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
