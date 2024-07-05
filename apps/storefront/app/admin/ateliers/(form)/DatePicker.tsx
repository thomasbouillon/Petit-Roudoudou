import { Controller } from 'react-hook-form';

type Props = {
  formControlKey: string;
  className?: string;
};

export default function DatePicker({ formControlKey, className }: Props) {
  return (
    <Controller
      name={formControlKey}
      render={({ field }) => (
        <input
          className={className}
          type="datetime-local"
          {...field}
          value={dateToValueString(field.value)}
          onChange={(e) => {
            field.onChange(new Date(e.target.value));
          }}
        />
      )}
    />
  );
}

const dateToValueString = (date: Date | undefined) => {
  if (!date) return undefined;
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
