'use client';

import { useFormContext } from 'react-hook-form';
import { Field } from '@couture-next/ui/form/Field';
import TextLengthWarning from './TextLengthWarning';

type Props = {
  title: string;
};

export default function ArticleStockSeoField({ title }: Props) {
  const register = useFormContext().register;

  return (
    <div className="mb-4 space-y-6">
      <h2 className="text-2xl font-serif">{title}</h2>
      <div className="">
        <h3 className="font-bold">Page de personnalisation</h3>
        <Field
          label="Titre de la page"
          widgetId="serp.title"
          helpText='J&apos;ajoute automatiquement "| Petit Roudoudou"'
          labelClassName="!items-start"
          renderWidget={(className) => <textarea {...register(`customizePage.serp.title`)} className={className} />}
        />
        <TextLengthWarning controlKey={`customizePage.serp.title`} minLength={44} maxLength={54} threshold={0.1} />
        <Field
          label="Description de la page"
          widgetId="serp.description"
          labelClassName="!items-start"
          renderWidget={(className) => (
            <textarea {...register(`customizePage.serp.description`)} className={className} rows={4} />
          )}
        />
        <TextLengthWarning
          controlKey={`customizePage.serp.description`}
          minLength={90}
          maxLength={150}
          threshold={0.1}
        />
      </div>
      <div>
        <h3 className="font-bold">Page de boutique avec tous les stocks</h3>
        <Field
          label="Titre de la page"
          widgetId="serp.title"
          helpText='J&apos;ajoute automatiquement "| Petit Roudoudou"'
          labelClassName="!items-start"
          renderWidget={(className) => <textarea {...register(`shopPage.serp.title`)} className={className} />}
        />
        <TextLengthWarning controlKey={`shopPage.serp.title`} minLength={44} maxLength={54} threshold={0.1} />
        <Field
          label="Description de la page"
          widgetId="serp.description"
          labelClassName="!items-start"
          renderWidget={(className) => (
            <textarea {...register(`shopPage.serp.description`)} className={className} rows={4} />
          )}
        />
        <TextLengthWarning controlKey={`shopPage.serp.description`} minLength={90} maxLength={150} threshold={0.1} />
      </div>
    </div>
  );
}
