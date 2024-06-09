import { FieldPath, useWatch } from 'react-hook-form';
import { ArticleSeoDTO } from './useArticleSeoForm';
import clsx from 'clsx';

type ControlKey = FieldPath<ArticleSeoDTO>;

type Props = {
  controlKey: ControlKey;
  minLength: number;
  maxLength: number;
  threshold: number;
};

export default function TextLengthWarning({ controlKey, minLength, maxLength, threshold }: Props) {
  console.log('controlKey', controlKey);
  const value = useWatch<ArticleSeoDTO, ControlKey>({ name: controlKey }) as string;

  const isValid = value.length >= minLength && value.length <= maxLength;
  const isWarning =
    !isValid && value.length >= minLength * (1 - threshold) && value.length <= maxLength * (1 + threshold);
  const isError = !isValid && !isWarning;

  return (
    <p
      className={clsx(
        'text-sm',
        isError && 'text-red-500',
        isWarning && 'text-yellow-600',
        isValid && 'text-green-500'
      )}
    >
      Longeur recommandée {minLength} - {maxLength} ({value.length})
    </p>
  );
}
