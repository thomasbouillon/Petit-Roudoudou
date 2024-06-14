'use client';

import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { ImagesField } from '@couture-next/ui/form/ImagesField';
import useStorage from 'apps/storefront/hooks/useStorage';

export default function ImagesPropsFields() {
  const { handleUpload } = useStorage();

  return (
    <>
      <p className="text-gray-500 text-xs text-center mb-4">Images pour la page de présentation de l&apos;article</p>
      <ImagesField multiple formControlKey="images" uploadFile={handleUpload} imageLoader={loader} />
    </>
  );
}
