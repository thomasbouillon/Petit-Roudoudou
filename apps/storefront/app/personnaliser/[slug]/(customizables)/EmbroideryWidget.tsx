import clsx from 'clsx';
import EmbroideryColorFieldWidget from './EmbroideryColorWidget';
import { useController } from 'react-hook-form';

export default function EmbroideryWidget({
  inputClassName,
  customizableUid,
}: {
  customizableUid: string;
  inputClassName?: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 sm:gap-2">
      <div className="h-full flex flex-col">
        <small className="block">Prénom, Petit mot, Surnom</small>
        <EmbroideryTextFieldWidget customizableUid={customizableUid} inputClassName={inputClassName} />
      </div>
      <div>
        <small className="block">Couleur</small>
        <div className={inputClassName}>
          <EmbroideryColorFieldWidget customizableUid={customizableUid} />
        </div>
      </div>
    </div>
  );
}

function EmbroideryTextFieldWidget({
  customizableUid,
  inputClassName,
  disabled,
}: {
  customizableUid: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const { field } = useController({ name: `customizations.${customizableUid}.text` });

  return (
    <input
      className={clsx(inputClassName, 'flex-grow')}
      value={field.value ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
