import { UseFormRegister } from 'react-hook-form';
import DetailsFormFields from './detailsFormFields';
import { FinalizeFormType } from './page';

type Props = {
  register: UseFormRegister<FinalizeFormType>;
};

export default function Colissimo({ register }: Props) {
  return (
    <div className="max-w-xs mx-auto md:max-w-lg w-full">
      <DetailsFormFields register={register} baseFieldPath="shipping" />
    </div>
  );
}
