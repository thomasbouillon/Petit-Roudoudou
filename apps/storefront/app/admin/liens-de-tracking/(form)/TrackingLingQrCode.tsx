import { useWatch } from 'react-hook-form';
import { TrackingLinkForm } from './Form';
import env from '../../../../env';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useDebounce } from 'apps/storefront/hooks/useDebounce';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Spinner } from '@couture-next/ui/Spinner';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import clsx from 'clsx';

export default function TrackingLinkQrCode() {
  const utmDetails = useWatch<TrackingLinkForm, 'utm'>({ name: 'utm' });
  const qrCodeSize = useWatch<TrackingLinkForm, 'qrCodeSize'>({ name: 'qrCodeSize' });
  const debouncedUtmDetails = useDebounce(utmDetails, 500);

  const svgElementRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    console.log('svgElementRef', svgElementRef.current);
  }, [svgElementRef.current]);

  const isValid = useMemo(() => {
    return Object.values(debouncedUtmDetails).every((value) => value.trim().length > 0);
  }, [debouncedUtmDetails]);

  const url = useMemo(() => {
    const url = new URL(env.BASE_URL);
    url.searchParams.append('utm_source', utmDetails.source);
    url.searchParams.append('utm_medium', utmDetails.medium);
    url.searchParams.append('utm_campaign', utmDetails.campaign);
    url.searchParams.append('utm_content', utmDetails.content);
    return url.toString();
  }, [debouncedUtmDetails]);

  const download = useCallback(async () => {
    if (!svgElementRef.current) return toast.error('Erreur lors du téléchargement');
    const toastId = toast.loading('Téléchargement en cours...');
    try {
      const blob = await svgElementToBlob(svgElementRef.current, qrCodeSize);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.png';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Téléchargé !', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du téléchargement', { id: toastId });
    }
  }, [svgElementRef.current, qrCodeSize]);

  const copyToClipboard = useCallback(async () => {
    if (!svgElementRef.current) return toast.error('Erreur lors de la copie');
    const toastId = toast.loading('Copie en cours...');
    try {
      const blob = await svgElementToBlob(svgElementRef.current, qrCodeSize);
      navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      toast.success('Copié !', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la copie', { id: toastId });
    }
  }, [svgElementRef.current, qrCodeSize]);

  return (
    <div className="flex justify-center gap-4 flex-wrap items-center">
      <div className="relative group">
        <QRCode value={url} ref={svgElementRef as any} level="H" />
        {(!isValid || debouncedUtmDetails !== utmDetails) && (
          <>
            <div className="absolute inset-[-1rem] opacity-50 bg-white"></div>
            {!isValid && (
              <>
                <div className="absolute bg-white top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-10 h-10"></div>
                <ExclamationCircleIcon className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-20 h-20 text-red-500" />
                <p className="group-hover:block hidden absolute top-1/2 left-1/2 -translate-x-1/2 bg-white p-2 text-center">
                  Remplis tous les champs
                </p>
              </>
            )}
            {debouncedUtmDetails !== utmDetails && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1/2 h-1/2">
                <Spinner className="w-full h-full" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={copyToClipboard}
            className={clsx('btn-secondary w-full text-center', !isValid && 'cursor-not-allowed opacity-50')}
            disabled={!isValid || debouncedUtmDetails !== utmDetails}
          >
            Copier
          </button>
          <p>(Pas disponible sur firefox)</p>
        </div>
        <button
          type="button"
          onClick={download}
          className={clsx('btn-secondary w-full text-center', !isValid && 'cursor-not-allowed opacity-50')}
          disabled={!isValid || debouncedUtmDetails !== utmDetails}
        >
          Télécharger
        </button>
      </div>
    </div>
  );
}

const svgElementToBlob = async (svgElement: SVGSVGElement, size: number) => {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = size;
  canvasEl.height = size;
  const ctx = canvasEl.getContext('2d')!;
  const imgEl = document.createElement('img');
  imgEl.crossOrigin = 'anonymous';

  // get svg data
  var xml = new XMLSerializer().serializeToString(svgElement);

  // make it base64
  var svg64 = btoa(xml);
  var b64Start = 'data:image/svg+xml;base64,';

  // prepend a "header"
  var image64 = b64Start + svg64;

  // set it as the source of the img element
  const drawPromise = new Promise<void>((resolve) => {
    imgEl.onload = function () {
      // draw the image onto the canvas
      ctx.drawImage(imgEl, 0, 0, size, size);
      resolve();
    };
  });
  imgEl.src = image64;

  await drawPromise;
  return await new Promise<Blob | null>((resolve) => canvasEl.toBlob(resolve, 'image/png')).then((blob) => {
    if (!blob) throw new Error('Blob is null');
    return blob;
  });
};
