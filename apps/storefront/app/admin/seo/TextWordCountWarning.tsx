import { FieldPath, useWatch } from 'react-hook-form';
import { ArticleSeoDTO } from './useArticleSeoForm';
import clsx from 'clsx';

type ControlKey = FieldPath<ArticleSeoDTO>;

type Props = {
  controlKey: ControlKey;
  minWords: number;
  maxWords: number;
  threshold: number;
};

export default function TextWordCountWarning({ controlKey, minWords, maxWords, threshold }: Props) {
  const value = useWatch<ArticleSeoDTO, ControlKey>({ name: controlKey }) as string;
  const wordCount = value.split(/\s+/).length;

  const isValid = wordCount >= minWords && wordCount <= maxWords;
  const isWarning = !isValid && wordCount >= minWords * (1 - threshold) && wordCount <= maxWords * (1 + threshold);
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
      Longeur recommandée {minWords} - {maxWords} mots ({wordCount})
    </p>
  );
}
