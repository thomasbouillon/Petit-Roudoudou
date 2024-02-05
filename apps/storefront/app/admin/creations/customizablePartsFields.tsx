import { Control, FieldError, FieldErrors, UseFormWatch, useFieldArray } from 'react-hook-form';
import { ArticleFormType } from './form';
import { Field } from '@couture-next/ui';
import { TrashIcon } from '@heroicons/react/24/outline';
import useFabricGroups from '../../../hooks/useFabricGroups';
import React from 'react';
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';

type Props = {
  control: Control<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
};

export default function CustomizablePartsFields({ control, watch, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customizables',
  });

  const { query: fabricListQuery } = useFabricGroups();
  if (fabricListQuery.isError) throw fabricListQuery.error;

  const customizablePartsOnly = fields
    .map((customizable, i) => Object.assign(customizable, { fieldId: i }))
    .filter((field) => field.type === 'customizable-part');

  const addCustomizablePart = () => {
    append({
      uid: uuid(),
      type: 'customizable-part',
      label: '',
      fabricListId: '',
      treeJsModelPartId: '',
      size: [0, 0],
    } satisfies ArticleFormType['customizables'][0]);
  };

  return (
    <div className="space-y-4">
      {customizablePartsOnly.map((field) => (
        <fieldset key={field.id} className="border p-4 relative">
          <h2 className="font-bold text-xl mb-4 min-h-[1.5em]">{watch(`customizables.${field.fieldId}.label`)}</h2>
          <button type="button" className="text-red-500 absolute top-4 right-4" onClick={() => remove(field.fieldId)}>
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Nom de la partie à personnaliser"
              widgetId={`customizables.${field.fieldId}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={errors.customizables?.[field.fieldId]?.label?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizables.${field.fieldId}.label`}
                  className={className}
                  {...control.register(`customizables.${field.fieldId}.label`)}
                />
              )}
            />
            <Field
              label="Groupe de tissus"
              widgetId={`customizables.${field.fieldId}.fabricListId`}
              error={errors.customizables?.[field.fieldId]?.fabricListId?.message}
              renderWidget={(className) => (
                <select
                  id={`customizables.${field.fieldId}.fabricListId`}
                  className={className}
                  disabled={fabricListQuery.isPending || fabricListQuery.data.length === 0}
                  {...control.register(`customizables.${field.fieldId}.fabricListId`)}
                >
                  {fabricListQuery.isPending && <option value="">Chargement...</option>}
                  {!fabricListQuery.isPending && fabricListQuery.data.length > 0 && (
                    <option value="">Choisir un groupe de tissus</option>
                  )}
                  {fabricListQuery.data?.map((fabricGroup) => (
                    <option key={fabricGroup._id} value={fabricGroup._id}>
                      {fabricGroup.name}
                    </option>
                  ))}
                  {fabricListQuery.data?.length === 0 && <option value="">Aucun groupe de tissus disponible</option>}
                </select>
              )}
            />
            <Field
              label="Taille sur le modèle 3D"
              widgetId={`customizables.${field.fieldId}.size`}
              error={
                (Array.isArray(errors.customizables?.[field.fieldId]?.size) &&
                  (errors.customizables?.[field.fieldId]?.size as FieldError[])
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
                    {...control.register(`customizables.${field.fieldId}.size.0`, {
                      valueAsNumber: true,
                    })}
                    className="w-full number-controls-hidden"
                  />
                  l:
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...control.register(`customizables.${field.fieldId}.size.1`, {
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
              widgetId={`customizables.${field.fieldId}.treeJsModelPartId`}
              helpText="Il s'agit de l'identifiant qui permet de cibler les éléments dans le modèle 3D"
              error={errors.customizables?.[field.fieldId]?.treeJsModelPartId?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`customizables.${field.fieldId}.treeJsModelPartId`}
                  className={className}
                  {...control.register(`customizables.${field.fieldId}.treeJsModelPartId`)}
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
