'use client';

import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import toast from 'react-hot-toast';
import { useWatch } from 'react-hook-form';
import { AddToCartFormType } from './app';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export function ImagePreview() {
  const imageDataUrl = useWatch<AddToCartFormType, 'imageDataUrl'>({ name: 'imageDataUrl' });

  const easteregg = () => {
    toast(`Oups, l'image n'est plus interactive, retourne en arrière pour la faire pivoter!`, {
      duration: 5000,
      icon: <ExclamationTriangleIcon className="text-yellow-500 block w-6 h-6" />,
    });
  };
  return (
    <div>
      <Image
        src={imageDataUrl}
        alt=""
        width={256}
        height={256}
        loader={loader}
        className="w-64 h-64 object-contain mx-auto my-6"
        onClick={easteregg}
        onTouchStart={easteregg}
      />
    </div>
  );
}
