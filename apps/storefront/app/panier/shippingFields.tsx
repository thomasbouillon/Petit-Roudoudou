import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormSchema } from './page';

type Props = {
  register: UseFormRegister<FormSchema>;
  errors: FieldErrors<FormSchema>;
};

export default function ShippingFields({ register, errors }: Props) {
  return (
    <>
      <label htmlFor="civility" className="mt-2 block">
        Civilité
      </label>
      <select
        {...register('shipping.civility')}
        id="civility"
        className="border w-full p-2 bg-transparent"
      >
        <option value="Mme">Mme</option>
        <option value="M">M</option>
      </select>
      <ErrorView error={errors.shipping?.civility?.message} />
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="lastName">
            Nom
          </label>
          <input
            {...register('shipping.lastName')}
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.shipping?.lastName?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="firstName">
            Prénom
          </label>
          <input
            {...register('shipping.firstName')}
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.shipping?.firstName?.message} />
        </div>
      </div>
      <label className="mt-2 block" htmlFor="address">
        Adresse
      </label>
      <input
        {...register('shipping.address')}
        type="text"
        className="border w-full p-2"
      />
      <ErrorView error={errors.shipping?.address?.message} />
      <label className="mt-2 block" htmlFor="addressComplement">
        Complement d&apos;adresse
      </label>
      <input
        {...register('shipping.addressComplement')}
        type="text"
        className="border w-full p-2"
      />
      <ErrorView error={errors.shipping?.addressComplement?.message} />
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="zipCode">
            Code postal
          </label>
          <input
            {...register('shipping.zipCode')}
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.shipping?.zipCode?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="city">
            Ville
          </label>
          <input
            {...register('shipping.city')}
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.shipping?.city?.message} />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="country">
            Pays
          </label>
          <input
            {...register('shipping.country')}
            type="text"
            className="border w-full p-2"
          />
          <ErrorView error={errors.shipping?.country?.message} />
        </div>
      </div>
    </>
  );
}

const ErrorView: React.FC<{ error?: string }> = ({ error }) => (
  <span className="text-red-500 empty:hidden">{error}</span>
);
