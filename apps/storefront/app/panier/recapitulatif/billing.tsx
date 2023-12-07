import { UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import DetailsFormFields from './detailsFormFields';

type Props = {
  register: UseFormRegister<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  setValue: UseFormSetValue<FinalizeFormType>;
};

export default function Billing({ setValue, register, watch }: Props) {
  return (
    <div className="w-full">
      <h2 className="text-center underline">Adresse de facturation</h2>
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
      {watch('billing') !== null && <DetailsFormFields register={register} baseFieldPath="billing" />}
    </div>
  );
}
