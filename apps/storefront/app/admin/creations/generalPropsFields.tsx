import { Field } from '@couture-next/ui';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { ArticleFormType } from './form';
import clsx from 'clsx';
import UploadFileModal from './uploadFileModal';
import { useCallback, useState } from 'react';

export default function GeneralPropsFields({
  register,
  errors,
  setValue,
  watch,
}: {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
}) {
  const [openUploadFileModal, setOpenUploadFileModal] = useState(false);

  const onTreeJsModelUploaded = useCallback(
    (url: string) => {
      setOpenUploadFileModal(false);
      setValue('treeJsModel', url, { shouldDirty: true });
    },
    [setOpenUploadFileModal, setValue]
  );

  return (
    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
      <p className="col-span-2 text-gray-500 text-xs text-center mb-4">
        Informations affichées sur la page de l&apos;article ainsi que dans les
        commandes
      </p>
      <Field
        label="Nom"
        widgetId="name"
        labelClassName="min-w-[min(30vw,15rem)]"
        error={errors.name?.message}
        renderWidget={(className) => (
          <input
            type="text"
            id="name"
            className={className}
            {...register('name')}
          />
        )}
      />
      <Field
        label="Description"
        widgetId="description"
        error={errors.description?.message}
        renderWidget={(className) => (
          <textarea
            id="description"
            className={className}
            {...register('description')}
          />
        )}
      />
      <Field
        label="Modèle 3D"
        error={errors.treeJsModel?.message}
        labelClassName="min-w-[min(30vw,15rem)]"
        widgetId="name"
        renderWidget={(className) => (
          <button
            type="button"
            className={clsx('btn-light', className)}
            onClick={() => setOpenUploadFileModal(true)}
          >
            {!watch('treeJsModel') ? 'Ajouter un modèle' : 'Modifier le modèle'}
          </button>
        )}
      />
      <UploadFileModal
        title="Ajouter un modèle 3D"
        buttonLabel="Ajouter le modèle"
        isOpen={openUploadFileModal}
        extension=".gltf"
        close={() => setOpenUploadFileModal(false)}
        onUploaded={onTreeJsModelUploaded}
        renderPreview={(url) => (
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full bg-gray-100 break-before-all">
            Aperçu indisponible, fichier:{' '}
            {decodeURIComponent(url.split('/').reverse()[0].split('?')[0])}
          </p>
        )}
      />
    </fieldset>
  );
}
