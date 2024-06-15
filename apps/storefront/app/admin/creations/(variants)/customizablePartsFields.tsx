import {
  Control,
  FieldError,
  FieldErrors,
  UseFormWatch,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { ArticleFormType } from '../form';
import { Field } from '@couture-next/ui/form/Field';
import { TrashIcon } from '@heroicons/react/24/outline';
import useFabricGroups from '../../../../hooks/useFabricGroups';
import React from 'react';
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';

type Props = {
  customizableVariantIndex: number;
};

export default function CustomizablePartsFields({ customizableVariantIndex }: Props) {
  const { fields, append, remove } = useFieldArray<ArticleFormType, `customizableVariants.${number}.customizableParts`>(
    {
      name: `customizableVariants.${customizableVariantIndex}.customizableParts`,
    }
  );
  const { errors } = useFormState<ArticleFormType>();
  const { register } = useFormContext<ArticleFormType>();

  const { query: fabricListQuery } = useFabricGroups();
  if (fabricListQuery.isError) throw fabricListQuery.error;

  const addCustomizablePart = () => {
    append({
      uid: uuid(),
      label: '',
      fabricListId: '',
      threeJsModelPartId: '',
      size: [0, 0] as [number, number],
    } satisfies ArticleFormType['customizableVariants'][number]['customizableParts'][number]);
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <fieldset key={field.id} className="border p-4 relative">
          <h2 className="font-bold text-xl mb-4 min-h-[1.5em]">{field.label}</h2>
          <button type="button" className="text-red-500 absolute top-4 right-4" onClick={() => remove(index)}>
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Nom de la partie à personnaliser"
              widgetId={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={
                errors.customizableVariants?.[customizableVariantIndex]?.customizableParts?.[index]?.label?.message
              }
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.label`}
                  className={className}
                  {...register(`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.label`)}
                />
              )}
            />
            <Field
              label="Groupe de tissus"
              widgetId={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.fabricListId`}
              error={
                errors.customizableVariants?.[customizableVariantIndex]?.customizableParts?.[index]?.fabricListId
                  ?.message
              }
              renderWidget={(className) => (
                <select
                  id={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.fabricListId`}
                  className={className}
                  disabled={fabricListQuery.isPending || fabricListQuery.data.length === 0}
                  {...register(
                    `customizableVariants.${customizableVariantIndex}.customizableParts.${index}.fabricListId`
                  )}
                >
                  {fabricListQuery.isPending && <option value="">Chargement...</option>}
                  {!fabricListQuery.isPending && fabricListQuery.data.length > 0 && (
                    <option value="">Choisir un groupe de tissus</option>
                  )}
                  {fabricListQuery.data?.map((fabricGroup) => (
                    <option key={fabricGroup.id} value={fabricGroup.id}>
                      {fabricGroup.name}
                    </option>
                  ))}
                  {fabricListQuery.data?.length === 0 && <option value="">Aucun groupe de tissus disponible</option>}
                </select>
              )}
            />
            <Field
              label="Taille sur le modèle 3D"
              widgetId={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.size`}
              error={
                (Array.isArray(
                  errors.customizableVariants?.[customizableVariantIndex]?.customizableParts?.[index]?.size
                ) &&
                  (
                    errors.customizableVariants?.[customizableVariantIndex]?.customizableParts?.[index]
                      ?.size as FieldError[]
                  )
                    .map(({ message }) => message)
                    .join(' ')) ||
                undefined
              }
              helpText="Permet de mettre les tissus à l'échelle dans un rendu 3D"
              renderWidget={(className) => (
                <div className={clsx(className, 'grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2')}>
                  L:
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...register(`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.size.0`, {
                      valueAsNumber: true,
                    })}
                    className="w-full number-controls-hidden"
                  />
                  l:
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...register(`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.size.1`, {
                      valueAsNumber: true,
                    })}
                    className="w-full number-controls-hidden"
                  />
                  cm
                </div>
              )}
            />
            <Field
              label="Identifiant dans le modèle 3D"
              widgetId={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.threeJsModelPartId`}
              helpText="Il s'agit de l'identifiant qui permet de cibler les éléments dans le modèle 3D"
              error={
                errors.customizableVariants?.[customizableVariantIndex]?.customizableParts?.[index]?.threeJsModelPartId
                  ?.message
              }
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizableVariants.${customizableVariantIndex}.customizableParts.${index}.threeJsModelPartId`}
                  className={className}
                  {...register(
                    `customizableVariants.${customizableVariantIndex}.customizableParts.${index}.threeJsModelPartId`
                  )}
                />
              )}
            />
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn-light mx-auto" onClick={addCustomizablePart}>
        Ajouter un element à personnaliser
      </button>
    </div>
  );
}
