import clsx from 'clsx';
import EmbroideryColorFieldWidget from './EmbroideryColorWidget';
import { useController } from 'react-hook-form';

export default function EmbroideryWidget({
  inputClassName,
  customizableUid,
  layout = 'horizontal',
}: {
  customizableUid: string;
  inputClassName?: string;
  layout?: 'horizontal' | 'vertical';
}) {
  return (
    <div className={clsx('grid', layout === 'horizontal' && 'sm:grid-cols-2 sm:gap-2')}>
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
