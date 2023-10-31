import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormSchema } from './page';

type Props = {
  register: UseFormRegister<FormSchema>;
  errors: FieldErrors<FormSchema>;
};

export default function BillingFields({ register, errors }: Props) {
  return (
    <>
      <label htmlFor="civility" className="mt-2 block">
        Civilité
      </label>
      <select
        {...register('billing.civility')}
        id="civility"
        className="border w-full p-2 bg-transparent"
      >
        <option value="Mme">Mme</option>
        <option value="M">M</option>
      </select>
      <ErrorView error={errors.billing?.civility?.message} />
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="lastName">
            Nom
          </label>
          <input
            {...register('billing.lastName')}
            id="lastName"
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.billing?.lastName?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="firstName">
            Prénom
          </label>
          <input
            {...register('billing.firstName')}
            id="firstName"
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.billing?.firstName?.message} />
        </div>
      </div>
      <label className="mt-2 block" htmlFor="address">
        Adresse
      </label>
      <input
        {...register('billing.address')}
        id="address"
        type="text"
        className="border w-full p-2"
      />
      <ErrorView error={errors.billing?.address?.message} />
      <label className="mt-2 block" htmlFor="addressComplement">
        Complement d&apos;adresse
      </label>
      <input
        {...register('billing.addressComplement')}
        id="addressComplement"
        type="text"
        className="border w-full p-2"
      />
      <ErrorView error={errors.billing?.addressComplement?.message} />
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="zipCode">
            Code postal
          </label>
          <input
            {...register('billing.zipCode')}
            id="zipCode"
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.billing?.zipCode?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="city">
            Ville
          </label>
          <input
            {...register('billing.city')}
            id="city"
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.billing?.city?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="country">
            Pays
          </label>
          <input
            {...register('billing.country')}
            id="country"
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.billing?.country?.message} />
        </div>
      </div>
    </>
  );
}

const ErrorView: React.FC<{ error?: string }> = ({ error }) => (
  <span className="text-red-500 empty:hidden">{error}</span>
);
