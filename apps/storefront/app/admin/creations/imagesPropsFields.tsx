import { useCallback, useState } from 'react';
import UploadImageModal from './uploadImageModal';
import Image from 'next/image';
import { FieldErrors } from 'react-hook-form';
import { ArticleFormType } from './form';

export default function ImagesPropsFields({
  images,
  setImages,
  errors,
}: {
  images: string[];
  setImages: (images: string[]) => void;
  errors: FieldErrors<ArticleFormType>;
}) {
  const [openModal, setOpenModal] = useState(false);

  const handleUpload = useCallback(
    (url: string) => {
      setImages([...images, url]);
    },
    [images, setImages]
  );

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
          {images.map((url) => (
            <Image
              src={url}
              width="256"
              height="256"
              key={url}
              alt=""
              className="object-contain object-center w-64 h-64"
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
        isOpen={openModal}
        close={() => setOpenModal(false)}
        onUploaded={handleUpload}
      />
    </fieldset>
  );
}
