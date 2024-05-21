import { Control, FieldErrors, UseFormRegister, UseFormWatch, useFieldArray } from 'react-hook-form';
import { ArticleFormType } from './form';
import { TrashIcon } from '@heroicons/react/24/solid';
import { Field } from '@couture-next/ui';
import { v4 as uuid } from 'uuid';

type Props = {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  control: Control<ArticleFormType>;
};

export default function CustomizablesFields({ errors, watch, control }: Props) {
  const {
    fields: customizables,
    append: addCustomizable,
    remove: removeCustomizable,
  } = useFieldArray({
    control,
    name: 'customizables',
  });

  const handleAddCustomizableBoolean = () => {
    addCustomizable({
      uid: uuid(),
      label: '',
      type: 'customizable-boolean',
      price: 0,
    });
  };

  const handleAddCustomizableText = () => {
    addCustomizable({
      uid: uuid(),
      label: '',
      type: 'customizable-text',
      max: 100,
      min: 0,
      price: 0,
    });
  };

  const handleAddCustomizablePiping = () => {
    addCustomizable({
      uid: uuid(),
      label: 'Passepoil',
      type: 'customizable-piping',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs text-center mb-4">Saisi ici toutes les options</p>
      {customizables.map((customizable, i) => (
        <fieldset key={customizable.id} className="border p-4 relative">
          <h2 className="font-bold text-xl min-h-[1.5em]">{watch(`customizables.${i}.label`)}</h2>
          <button type="button" className="text-red-500 absolute top-4 right-4" onClick={() => removeCustomizable(i)}>
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Nom de l'option"
              widgetId={`customizable.${i}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={errors.customizables?.[i]?.label?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizable.${i}.label`}
                  className={className}
                  {...control.register(`customizables.${i}.label`)}
                />
              )}
            />
            {customizable.type !== 'customizable-piping' && (
              <Field
                label="Supplément (HT€)"
                widgetId={`customizable.${i}.price`}
                error={errors.customizables?.[i]?.price?.message}
                renderWidget={(className) => (
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    id={`customizable.${i}.price`}
                    className={className}
                    {...control.register(`customizables.${i}.price`, { valueAsNumber: true })}
                  />
                )}
              />
            )}

            {customizable.type === 'customizable-text' && (
              <>
                <Field
                  label="Taille minimale"
                  widgetId={`customizable.${i}.min`}
                  error={errors.customizables?.[i]?.min?.message}
                  renderWidget={(className) => (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      id={`customizable.${i}.min`}
                      className={className}
                      {...control.register(`customizables.${i}.min`, { valueAsNumber: true })}
                    />
                  )}
                />
                <Field
                  label="Taille maximale"
                  widgetId={`customizable.${i}.max`}
                  error={errors.customizables?.[i]?.max?.message}
                  renderWidget={(className) => (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      id={`customizable.${i}.max`}
                      className={className}
                      {...control.register(`customizables.${i}.max`, { valueAsNumber: true })}
                    />
                  )}
                />
              </>
            )}
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn-light mx-auto mt-6" onClick={handleAddCustomizableBoolean}>
        Ajouter une option cochable
      </button>
      <button type="button" className="btn-light mx-auto !mt-0" onClick={handleAddCustomizableText}>
        Ajouter une option textuelle
      </button>
      <button type="button" className="btn-light mx-auto !mt-0" onClick={handleAddCustomizablePiping}>
        Ajouter une option passepoil
      </button>
    </div>
  );
}
