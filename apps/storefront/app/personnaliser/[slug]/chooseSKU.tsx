import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '@couture-next/ui';
import { Article } from '@couture-next/types';

const schema = z.record(z.string().nonempty('Selectionnez une option'));

type Props = {
  article: Article;
  onSKUSelected: (sku: Article['skus'][0]['uid']) => void;
};

export default function ChooseSKU({ article, onSKUSelected }: Props) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const onSubmit = handleSubmit((data) => {
    const sku = article.skus.find((sku) =>
      Object.entries(data).every(
        ([characteristicId, characteristicValueId]) =>
          sku.characteristics[characteristicId] === characteristicValueId
      )
    );

    if (sku) {
      onSKUSelected(sku.uid);
    } else {
      console.error('No SKU found for these characteristics', data);
    }
  });

  return (
    <>
      <h2 className="font-serif text-2xl mb-4">1. Je choisis ma couverture</h2>
      <form onSubmit={onSubmit}>
        <h3 className="font-bold">Description</h3>
        {article.description.split('\n').map((p) => (
          <p key={p}>{p}</p>
        ))}
        <div className="grid gap-4">
          {Object.entries(article.characteristics).map(
            ([characteristicId, characteristic]) => (
              <div key={characteristicId}>
                <Field
                  label={characteristic.label}
                  labelClassName="!items-start"
                  widgetId={characteristicId}
                  error={errors[characteristicId]?.message}
                  renderWidget={(className) => (
                    <select
                      key={characteristicId}
                      className={className}
                      {...register(characteristicId)}
                      id={characteristicId}
                    >
                      <option value="">Choisissez une option</option>
                      {Object.entries(characteristic.values).map(
                        ([valueId, valueLabel]) => (
                          <option key={valueId} value={valueId}>
                            {valueLabel}
                          </option>
                        )
                      )}
                    </select>
                  )}
                />
              </div>
            )
          )}
        </div>
        <button type="submit" className="btn-primary mx-auto mt-8">
          Suivant
        </button>
      </form>
    </>
  );
}
