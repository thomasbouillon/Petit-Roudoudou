import { Field } from '@couture-next/ui';
import {
  useFieldArray,
  Control,
  UseFormWatch,
  FieldErrors,
  UseFormSetValue,
  UseFormGetValues,
} from 'react-hook-form';
import { ArticleFormType } from './form';
import { useCallback, useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import UploadImageModal from './uploadFileModal';
import clsx from 'clsx';
import { Sku } from '@couture-next/types';
import { v4 as uuid } from 'uuid';

type Props = {
  // register: UseFormRegister<ArticleFormType>;
  errors: FieldErrors<ArticleFormType>;
  setValue: UseFormSetValue<ArticleFormType>;
  watch: UseFormWatch<ArticleFormType>;
  control: Control<ArticleFormType>;
  getValues: UseFormGetValues<ArticleFormType>;
};

function getSkuLabel(
  sku: Sku,
  characteristics: ArticleFormType['characteristics']
) {
  const skuDesc = Object.entries(sku?.characteristics)
    .map(([characId, valueId]) => characteristics[characId].values[valueId])
    .join(' - ');
  return skuDesc ?? '(Default)';
}

export default function StockPropsFields({
  control,
  watch,
  errors,
  setValue,
  getValues,
}: Props) {
  const [openUploadFileModal, setOpenUploadFileModal] = useState(false);
  const [currentStockIndexForImageUpload, setCurrentStockIndexForImageUpload] =
    useState(null as null | number);
  const [editingStockImageIndex, setEditingStockImageIndex] = useState(
    null as null | number
  );

  const {
    fields: stocks,
    append: addStock,
    remove: removeStock,
  } = useFieldArray({
    name: 'stocks',
    control,
  });

  const handleAddStock = useCallback(() => {
    addStock({
      uid: uuid(),
      title: '',
      description: '',
      images: [],
      sku: '',
      stock: 0,
    });
  }, [addStock]);

  const onImageUploaded = useCallback(
    (url: string, uid: string) => {
      if (currentStockIndexForImageUpload === null) return;
      if (editingStockImageIndex === null)
        // new image
        setValue(
          `stocks.${currentStockIndexForImageUpload}.images`,
          [
            ...getValues(`stocks.${currentStockIndexForImageUpload}.images`),
            { url, uid },
          ],
          { shouldDirty: true }
        );
      // editing image
      else
        setValue(
          `stocks.${currentStockIndexForImageUpload}.images.${editingStockImageIndex}`,
          { url, uid },
          { shouldDirty: true }
        );
    },
    [
      setValue,
      currentStockIndexForImageUpload,
      editingStockImageIndex,
      stocks,
      getValues,
    ]
  );

  const detailedSkus = useMemo(
    () =>
      watch('skus').map((sku) => ({
        label: getSkuLabel(sku, watch('characteristics')),
        uid: sku.uid,
      })),
    [watch]
  );

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs text-center mb-4">
        Saisi ici tous les stocks que tu as cousu pour cet article. Ils
        apparaîtront dans boutique.
      </p>
      <p className="text-gray-500 text-xs text-center mb-4">
        Le prix est définit par le SKU.
      </p>
      {errors.stocks && (
        <div className="text-red-500 text-xs text-center mb-4">
          {JSON.stringify(errors.stocks)}
        </div>
      )}
      {stocks.map((stock, i) => (
        <fieldset key={stock.id} className="border p-4 relative">
          <h2 className="font-bold text-xl mb-4 min-h-[1.5em]">
            {watch(`stocks.${i}.title`)}
          </h2>
          <button
            type="button"
            className="text-red-500 absolute top-4 right-4"
            onClick={() => removeStock(i)}
          >
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <Field
              label="Titre"
              widgetId={`stocks.${i}.label`}
              labelClassName="min-w-[min(30vw,15rem)]"
              error={errors.stocks?.[i]?.title?.message}
              renderWidget={(className) => (
                <input
                  type="text"
                  id={`stocks.${i}.label`}
                  className={className}
                  {...control.register(`stocks.${i}.title`)}
                />
              )}
            />
            <Field
              label="Description"
              widgetId={`stocks.${i}.description`}
              error={errors.stocks?.[i]?.description?.message}
              renderWidget={(className) => (
                <textarea
                  id={`stocks.${i}.label`}
                  className={className}
                  {...control.register(`stocks.${i}.description`)}
                />
              )}
            />
            <Field
              label="SKU"
              widgetId={`stocks.${i}.sku`}
              error={errors.stocks?.[i]?.sku?.message}
              renderWidget={(className) => (
                <select
                  id={`stocks.${i}.sku`}
                  className={className}
                  {...control.register(`stocks.${i}.sku`)}
                >
                  <option value=""></option>
                  {detailedSkus.map((sku, i) => (
                    <option key={i} value={sku.uid}>
                      {sku.label}
                    </option>
                  ))}
                </select>
              )}
            />

            <Field
              label="Images"
              widgetId={`stocks.${i}.images`}
              error={errors.stocks?.[i]?.images?.message}
              renderWidget={(className) => (
                <div className={clsx(className, 'space-y-4')}>
                  <div
                    className="flex flex-wrap"
                    hidden={watch(`stocks.${i}.images`).length === 0}
                  >
                    {watch(`stocks.${i}.images`)?.map((image) => (
                      <Image
                        alt=""
                        src={image.url}
                        key={image.uid}
                        loader={
                          image.uid.startsWith('uploaded/') ? undefined : loader
                        }
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain mx-auto"
                        onClick={() => {
                          setEditingStockImageIndex(i);
                          setOpenUploadFileModal(true);
                          setCurrentStockIndexForImageUpload(i);
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenUploadFileModal(true);
                      setCurrentStockIndexForImageUpload(i);
                    }}
                    className="btn-light py-0 w-full"
                  >
                    Ajouter une image
                  </button>
                </div>
              )}
            />
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className="btn-light mx-auto mt-6"
        onClick={handleAddStock}
      >
        Ajouter un article au stock
      </button>
      {/* <Field
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
      /> */}

      <UploadImageModal
        title="Ajouter une image"
        buttonLabel="Ajouter l'image"
        renderPreview={(url) => (
          <Image
            className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100 object-center"
            src={url}
            unoptimized
            width={258}
            height={258}
            alt=""
          />
        )}
        previousFileUrl={
          editingStockImageIndex !== null
            ? stocks[editingStockImageIndex].images[0]?.url
            : undefined
        }
        isOpen={openUploadFileModal}
        close={() => {
          setOpenUploadFileModal(false);
          setEditingStockImageIndex(null);
          setCurrentStockIndexForImageUpload(null);
        }}
        onUploaded={onImageUploaded}
      />
    </div>
  );
}
