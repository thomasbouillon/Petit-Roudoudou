import { Control, FieldErrors, UseFormRegister, UseFormWatch, useFieldArray } from 'react-hook-form';
import { ArticleFormType } from './form';
import { TrashIcon } from '@heroicons/react/24/solid';
import { Field } from '@couture-next/ui';
import { v4 as uuid } from 'uuid';

type Props = {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  // setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  control: Control<ArticleFormType>;
  // getValues: UseFormGetValues<ArticleFormType>;
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

  const notCustomizablePartsOnly = customizables
    .map((customizable, i) => Object.assign(customizable, { fieldId: i }))
    .filter((field) => field.type !== 'customizable-part');

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

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs text-center mb-4">Saisi ici toutes les options</p>
      {notCustomizablePartsOnly.map((customizable) => (
        <fieldset key={customizable.id} className="border p-4 relative">
          <h2 className="font-bold text-xl min-h-[1.5em]">{watch(`customizables.${customizable.fieldId}.label`)}</h2>
          <button
            type="button"
            className="text-red-500 absolute top-4 right-4"
            onClick={() => removeCustomizable(customizable.fieldId)}
          >
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Nom de l'option"
              widgetId={`customizable.${customizable.fieldId}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={errors.customizables?.[customizable.fieldId]?.label?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizable.${customizable.fieldId}.label`}
                  className={className}
                  {...control.register(`customizables.${customizable.fieldId}.label`)}
                />
              )}
            />
            <Field
              label="Supplément (HT€)"
              widgetId={`customizable.${customizable.fieldId}.price`}
              error={errors.customizables?.[customizable.fieldId]?.price?.message}
              renderWidget={(className) => (
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  id={`customizable.${customizable.fieldId}.price`}
                  className={className}
                  {...control.register(`customizables.${customizable.fieldId}.price`, { valueAsNumber: true })}
                />
              )}
            />

            {customizable.type === 'customizable-text' && (
              <>
                <Field
                  label="Taille minimale"
                  widgetId={`customizable.${customizable.fieldId}.min`}
                  error={errors.customizables?.[customizable.fieldId]?.min?.message}
                  renderWidget={(className) => (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      id={`customizable.${customizable.fieldId}.min`}
                      className={className}
                      {...control.register(`customizables.${customizable.fieldId}.min`, { valueAsNumber: true })}
                    />
                  )}
                />
                <Field
                  label="Taille maximale"
                  widgetId={`customizable.${customizable.fieldId}.max`}
                  error={errors.customizables?.[customizable.fieldId]?.max?.message}
                  renderWidget={(className) => (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      id={`customizable.${customizable.fieldId}.max`}
                      className={className}
                      {...control.register(`customizables.${customizable.fieldId}.max`, { valueAsNumber: true })}
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
    </div>
  );
}
