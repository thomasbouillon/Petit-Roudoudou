import { Field } from '@couture-next/ui';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ArticleFormType } from './form';
import clsx from 'clsx';
import UploadFileModal from './uploadFileModal';
import { useCallback, useState } from 'react';
import { routes } from '@couture-next/routing';
import { createSlugFromTitle } from './utils';

function getUrlPreview(articleName: string) {
  return routes().shop().article(createSlugFromTitle(articleName)).index();
}

export default function GeneralPropsFields({
  register,
  errors,
  setValue,
  watch,
  getUid,
}: {
  register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  getUid?: (stockIndex?: string) => string;
}) {
  const [openUploadFileModal, setOpenUploadFileModal] = useState(false);

  const onTreeJsModelUploaded = useCallback(
    (file: { url: string; uid: string }) => {
      setOpenUploadFileModal(false);
      setValue('treeJsModel.url', file.url, { shouldDirty: true });
      setValue('treeJsModel.uid', file.uid, { shouldDirty: true });
    },
    [setOpenUploadFileModal, setValue]
  );

  return (
    <fieldset className="grid grid-cols-[auto_1fr] gap-4">
      <div className="col-span-2 mb-4 space-y-2">
        <p className="text-gray-500 text-xs text-center">
          Informations affichées sur la page de l&apos;article ainsi que dans les commandes
        </p>
        {!!getUid && (
          <p className="text-center text-gray-500 text-xs">
            Identifiant: <pre className="font-bold">{getUid()}</pre>
          </p>
        )}
      </div>

      <Field
        label="Nom"
        widgetId="name"
        labelClassName="min-w-[min(30vw,15rem)]"
        error={errors.name?.message}
        renderWidget={(className) => <input type="text" id="name" className={className} {...register('name')} />}
      />
      <Field
        label="Nom"
        widgetId="namePlural"
        labelClassName="min-w-[min(30vw,15rem)]"
        helpText="(pluriel)"
        error={errors.namePlural?.message}
        renderWidget={(className) => (
          <>
            <input
              type="text"
              id="namePlural"
              className={className}
              list="namePluralList"
              {...register('namePlural')}
            />
            <datalist id="namePluralList">
              <option value={watch('name') + 's'} />
            </datalist>
          </>
        )}
      />
      <Field
        label="Lien dans la boutique"
        widgetId="shopLink"
        labelClassName="min-w-[min(30vw,15rem)]"
        renderWidget={(className) => (
          <input
            type="text"
            id="shopLink"
            disabled
            className={clsx(className, 'opacity-50 cursor-not-allowed')}
            value={getUrlPreview(watch('namePlural'))}
          />
        )}
      />
      <Field
        label="Description"
        widgetId="description"
        error={errors.description?.message}
        renderWidget={(className) => <textarea id="description" className={className} {...register('description')} />}
      />
      <Field
        label="Modèle 3D"
        error={errors.treeJsModel?.uid?.message}
        labelClassName="min-w-[min(30vw,15rem)]"
        widgetId="name"
        renderWidget={(className) => (
          <button type="button" className={clsx('btn-light', className)} onClick={() => setOpenUploadFileModal(true)}>
            {!watch('treeJsModel.uid') ? 'Ajouter un modèle' : 'Modifier le modèle'}
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
            Aperçu indisponible, fichier: {decodeURIComponent(url.split('/').reverse()[0].split('?')[0])}
          </p>
        )}
      />
    </fieldset>
  );
}
