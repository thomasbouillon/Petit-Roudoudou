import { useFormContext } from 'react-hook-form';
import { FinalizeFormType } from './page';

type Props = {
  baseFieldPath: 'shipping' | 'billing';
  variant?: 'default' | 'with-country';
};

const DetailsFormFields = ({ baseFieldPath, variant }: Props) => {
  const { register } = useFormContext<FinalizeFormType>();
  return (
    <>
      <label htmlFor="civility" className="mt-2 block">
        Civilité
      </label>
      <select
        {...register(`${baseFieldPath}.civility`, { required: true })}
        id="civility"
        className="border w-full p-2 bg-transparent"
      >
        <option value="MRS">Mme</option>
        <option value="MR">M</option>
      </select>
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="lastName">
            Nom
          </label>
          <input
            {...register(`${baseFieldPath}.lastName`, { required: true })}
            type="text"
            className="border w-full p-2"
          />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="firstName">
            Prénom
          </label>
          <input
            {...register(`${baseFieldPath}.firstName`, { required: true })}
            type="text"
            className="border w-full p-2"
          />
        </div>
      </div>
      {baseFieldPath === 'shipping' && (
        <>
          <label className="mt-2 block" htmlFor="phoneNumber">
            Numéro de téléphone
          </label>
          <input
            {...register(`${baseFieldPath}.phoneNumber`, { required: true })}
            type="text"
            className="border w-full p-2"
          />
          <small className="block -translate-y-1">
            Ne concerne que la livraison, aucune offre commerciale ne sera envoyée.
          </small>
        </>
      )}
      <label className="mt-2 block" htmlFor="address">
        Adresse
      </label>
      <input {...register(`${baseFieldPath}.address`, { required: true })} type="text" className="border w-full p-2" />
      <label className="mt-2 block" htmlFor="addressComplement">
        Complement d&apos;adresse
      </label>
      <input {...register(`${baseFieldPath}.addressComplement`)} type="text" className="border w-full p-2" />
      <div className="md:grid md:grid-cols-2 md:gap-2">
        <div>
          <label className="mt-2 block" htmlFor="zipCode">
            Code postal
          </label>
          <input
            {...register(`${baseFieldPath}.zipCode`, { required: true })}
            type="text"
            className="border w-full p-2"
          />
        </div>
        <div>
          <label className="mt-2 block" htmlFor="city">
            Ville
          </label>
          <input {...register(`${baseFieldPath}.city`, { required: true })} type="text" className="border w-full p-2" />
        </div>
      </div>
      {variant === 'with-country' && (
        <>
          <label className="mt-2 block" htmlFor="country">
            Pays
          </label>
          <input
            {...register(`${baseFieldPath}.country`, { required: true })}
            type="text"
            className="border w-full p-2"
          />
        </>
      )}
    </>
  );
};
DetailsFormFields.displayName = 'DetailsFormFields';

export default DetailsFormFields;
