import { useFieldArray, useFormContext, useFormState } from 'react-hook-form';
import { ArticleFormType } from '../form';
import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Field } from '@couture-next/ui/form/Field';
import { FilesField } from '@couture-next/ui/form/FilesField';
import { ImagesField } from '@couture-next/ui/form/ImagesField';
import useStorage from 'apps/storefront/hooks/useStorage';
import clsx from 'clsx';
import CustomizablePartsFields from './customizablePartsFields';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/24/solid';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import InheritedCharacteristics from './inheritedCharacteristics';

export default function CustomizableVariants() {
  const { fields, append, remove } = useFieldArray<ArticleFormType, 'customizableVariants'>({
    name: 'customizableVariants',
  });
  const register = useFormContext<ArticleFormType>().register;
  const errors = useFormState<ArticleFormType>().errors;
  const handleUpload = useStorage().handleUpload;

  const addCustomizableVariant = useCallback(() => {
    append({
      name: '',
      uid: uuid(),
      threeJsModel: {
        uid: '',
        url: '',
      },
      image: {
        uid: '',
        url: '',
      },
      threeJsAllAxesRotation: false,
      threeJsInitialCameraDistance: 1,
      disclaimer: '',
      inherits: [],
      customizableParts: [],
      threeJsInitialEulerRotation: {
        x: 0,
        y: 0,
        z: 0,
      },
    });
  }, [append]);

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[auto_1fr] gap-4 first:border-t-0 border-t-2 pt-4">
          <div className="text-lg font-bold">Modèle 3D - {index + 1}</div>
          <button type="button" onClick={() => remove(index)} className="text-right text-red-500">
            <TrashIcon className="w-6 h-6 ml-auto" />
          </button>
          <Field
            label="Nom"
            widgetId="name"
            labelClassName="min-w-[min(30vw,10rem)]"
            renderWidget={(className) => (
              <input className={className} type="text" {...register(`customizableVariants.${index}.name`)} />
            )}
          />
          <Field
            label="Modèle 3D"
            error={
              errors.customizableVariants?.[index]?.threeJsModel?.url?.message ||
              errors.customizableVariants?.[index]?.threeJsModel?.uid?.message
            }
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="name"
            renderWidget={(className) => (
              <div className={clsx('relative', className)}>
                <FilesField
                  formControlKey={`customizableVariants.${index}.threeJsModel`}
                  uploadFile={handleUpload}
                  renderFile={(v) => <div>{v.uid ? 'fichier.gltf' : ''}</div>}
                  ui={{
                    addFileButtonClassName: 'btn-light mx-auto mt-2',
                    addFileButtonLabel: field.threeJsModel.uid ? 'Ajouter un modèle' : 'Modifier le modèle',
                  }}
                  acceptFileType=".gltf"
                />
              </div>
            )}
          />
          <Field
            label="Image de présentation"
            error={
              errors.customizableVariants?.[index]?.image?.url?.message ||
              errors.customizableVariants?.[index]?.image?.uid?.message
            }
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="image"
            renderWidget={(className) => (
              <div className={clsx('relative', className)}>
                <ImagesField
                  formControlKey={`customizableVariants.${index}.image`}
                  uploadFile={handleUpload}
                  imageLoader={loader}
                />
              </div>
            )}
          />
          <InheritedCharacteristics customizableVariantIndex={index} />
          <Field
            label="Message d'avertissement pour la personnalisation"
            error={errors.customizableVariants?.[index]?.disclaimer?.message}
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="disclaimerWhenCustomizingFabrics"
            renderWidget={(className) => (
              <input
                {...register(`customizableVariants.${index}.disclaimer`)}
                id="disclaimerWhenCustomizingFabrics"
                className={className}
              />
            )}
          />
          <Field
            label="Position initiale de la caméra"
            error={errors.customizableVariants?.[index]?.threeJsInitialCameraDistance?.message}
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="threeJsInitialCameraDistance"
            renderWidget={(className) => (
              <input
                id="threeJsInitialCameraDistance"
                className={className}
                {...register(`customizableVariants.${index}.threeJsInitialCameraDistance`, { valueAsNumber: true })}
              />
            )}
          />
          <Field
            label="Rotation Eulérienne initiale"
            error={errors.customizableVariants?.[index]?.threeJsInitialEulerRotation?.message}
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="threeJsInitialEulerRotation"
            renderWidget={(className) => (
              <div className={clsx(className, 'grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] gap-2')}>
                x:
                <input
                  className="w-full"
                  {...register(`customizableVariants.${index}.threeJsInitialEulerRotation.x`, {
                    valueAsNumber: true,
                  })}
                />
                y:
                <input
                  className="w-full"
                  {...register(`customizableVariants.${index}.threeJsInitialEulerRotation.y`, {
                    valueAsNumber: true,
                  })}
                />
                z:
                <input
                  className="w-full"
                  {...register(`customizableVariants.${index}.threeJsInitialEulerRotation.z`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            )}
          />
          <Field
            label="Rotation autour de tous les axes"
            helpText="Si coché, on pourra tourner l'article 3D dans tous les sens, sinon seulement sur la droite/gauche"
            error={errors.customizableVariants?.[index]?.threeJsAllAxesRotation?.message}
            labelClassName="min-w-[min(30vw,10rem)]"
            widgetId="threeJsAllAxesRotation"
            renderWidget={(className) => (
              <div className={className}>
                <input
                  id="threeJsAllAxesRotation"
                  className="w-5 h-5"
                  type="checkbox"
                  {...register(`customizableVariants.${index}.threeJsAllAxesRotation`)}
                />
              </div>
            )}
          />
          <div className="col-span-full">
            <Disclosure>
              <Disclosure.Button className="btn w-full mb-1 flex justify-center gap-4">
                Éléments à personnaliser <ChevronDownIcon className="w-6 h-6" />
              </Disclosure.Button>
              <Disclosure.Panel>
                <CustomizablePartsFields customizableVariantIndex={index} />
              </Disclosure.Panel>
            </Disclosure>
          </div>
        </div>
      ))}
      <button className="btn-primary mx-auto mt-6" onClick={addCustomizableVariant}>
        Ajouter un modèle 3D
      </button>
    </div>
  );
}
