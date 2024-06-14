import { useFormContext } from 'react-hook-form';
import { Field } from '@couture-next/ui/form/Field';
import TextLengthWarning from './TextLengthWarning';
import TextWordCountWarning from './TextWordCountWarning';

type Props = {
  title: string;
  stockIndex: number;
};

export default function ArticleSeoField({ stockIndex, title }: Props) {
  const register = useFormContext().register;

  return (
    <div>
      <h4 className="text-2xl font-serif">{title}</h4>
      <div className="">
        <Field
          label="Titre de la page"
          widgetId="serp.title"
          helpText='J&apos;ajoute automatiquement "| Petit Roudoudou"'
          labelClassName="!items-start"
          renderWidget={(className) => (
            <textarea {...register(`stockShopPages.${stockIndex}.serp.title`)} className={className} />
          )}
        />
        <TextLengthWarning
          controlKey={`stockShopPages.${stockIndex}.serp.title`}
          minLength={44}
          maxLength={54}
          threshold={0.1}
        />
        <Field
          label="Description de la page"
          widgetId="serp.description"
          labelClassName="!items-start"
          renderWidget={(className) => (
            <textarea {...register(`stockShopPages.${stockIndex}.serp.description`)} className={className} rows={4} />
          )}
        />
        <TextLengthWarning
          controlKey={`stockShopPages.${stockIndex}.serp.description`}
          minLength={90}
          maxLength={150}
          threshold={0.1}
        />
        <Field
          label="Description façon article de blog"
          widgetId="serp.description"
          labelClassName="!items-start"
          renderWidget={(className) => (
            <textarea {...register(`stockShopPages.${stockIndex}.fullDescription`)} className={className} rows={10} />
          )}
        />
        <TextWordCountWarning
          controlKey={`stockShopPages.${stockIndex}.fullDescription`}
          minWords={1000}
          maxWords={2000}
          threshold={0.01}
        />
      </div>
    </div>
  );
}
