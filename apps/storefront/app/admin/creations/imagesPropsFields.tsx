import { useCallback, useEffect, useState } from 'react';
import UploadImageModal from './uploadFileModal';
import Image from 'next/image';
import { FieldErrors } from 'react-hook-form';
import { ArticleFormType } from './form';
import { Article } from '@couture-next/types';
import { loader } from '../../../utils/next-image-firebase-storage-loader';

export default function ImagesPropsFields({
  images,
  onUpload,
  onImageChange,
  errors,
}: {
  images: Article['images'];
  onUpload: (url: string, uid: string) => void;
  onImageChange: (index: number, image: { url: string; uid: string }) => void;
  errors: FieldErrors<ArticleFormType>;
}) {
  const [openModal, setOpenModal] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null
  );

  const editImage = useCallback(
    (index: number) => {
      setEditingImageIndex(index);
      setOpenModal(true);
    },
    [setEditingImageIndex, setOpenModal]
  );

  const handleUpload = useCallback(
    (url: string, uid: string) => {
      if (editingImageIndex !== null) {
        onImageChange(editingImageIndex, { url, uid });
        setEditingImageIndex(null);
      } else {
        onUpload(url, uid);
      }
      setOpenModal(false);
    },
    [onUpload, setOpenModal, editingImageIndex, onImageChange]
  );

  // Reset selection on images change
  useEffect(() => {
    setEditingImageIndex(null);
  }, [images]);

  return (
    <fieldset>
      <p className="text-gray-500 text-xs text-center mb-4">
        Images pour la page de présentation de l&apos;article
      </p>
      {errors.images && (
        <p className="text-red-500 text-center mb-4">{errors.images.message}</p>
      )}
      {images.length > 0 && (
        <div className="py-16 flex flex-wrap">
          {images.map((image, i) => (
            <Image
              src={image.url}
              width="256"
              height="256"
              key={image.url}
              loader={image.uid.startsWith('uploaded/') ? undefined : loader}
              alt={image.uid}
              className="object-contain object-center w-64 h-64"
              onClick={() => editImage(i)}
            />
          ))}
        </div>
      )}
      {images.length === 0 && (
        <div>
          <div className="grid grid-cols-[repeat(auto-fill,min(12rem,100%))] justify-center mx-auto gap-4 relative max-h-72 overflow-hidden">
            <div className="w-48 h-72 bg-gray-100"></div>
            <div className="w-48 h-72 bg-gray-100"></div>
            <div className="w-48 h-72 bg-gray-100"></div>
            <div className="w-48 h-72 bg-gray-100"></div>
            <button
              type="button"
              className="btn-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              onClick={() => setOpenModal(true)}
            >
              Ajouter une image
            </button>
          </div>
        </div>
      )}
      {images.length > 0 && (
        <button
          type="button"
          className="btn-light mx-auto"
          onClick={() => setOpenModal(true)}
        >
          Ajouter une image
        </button>
      )}
      <UploadImageModal
        title="Ajouter une image"
        buttonLabel="Ajouter l'image"
        isOpen={openModal}
        close={() => setOpenModal(false)}
        onUploaded={handleUpload}
        extension=".jpg,.jpeg,.png,.webp"
        previousFileUrl={
          editingImageIndex !== null ? images[editingImageIndex].url : undefined
        }
        renderPreview={(url) => (
          <img
            className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100 object-center"
            src={url}
          />
        )}
      />
    </fieldset>
  );
}
