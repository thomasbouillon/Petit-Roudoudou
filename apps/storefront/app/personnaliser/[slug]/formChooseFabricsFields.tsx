import { Disclosure, Transition } from '@headlessui/react';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { ReactComponent as RandomIcon } from '../../../assets/random.svg';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import useFabricsFromGroups from '../../../hooks/useFabricsFromGroups';
import { Article, CustomizablePart } from '@couture-next/types';
import Image from 'next/image';
import Article3DScene from './article3DScene';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AddToCartFormType } from './page';
import useBlockBodyScroll from '../../../hooks/useBlockBodyScroll';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  className?: string;
  article: Article;
  watch: UseFormWatch<AddToCartFormType>;
  setValue: UseFormSetValue<AddToCartFormType>;
  onNextStep: () => void;
};

export default function FormCustomizableFields({ className, article, watch, setValue, onNextStep }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera>(null);
  const setBodyScrollBlocked = useBlockBodyScroll();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isFullscreen = searchParams.get('fullscreen') === 'true';

  const canSubmit = useMemo(() => {
    return article.customizables.every(
      (customizable) => customizable.type !== 'customizable-part' || !!watch('customizations')[customizable.uid]
    );
  }, [article.customizables, Object.values(watch('customizations'))]);

  const handleFinished = useCallback(async () => {
    if (!canvasRef.current || !cameraRef.current) throw 'Impossible';
    cameraRef.current.position.set(0, 1.1, 0);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const croppedCanvas = autoCrop(canvasRef.current);
    const preview = croppedCanvas.toDataURL('image/png');
    setValue('imageDataUrl', preview, { shouldValidate: true });
    onNextStep();
  }, [onNextStep, setValue]);

  const getFabricsByGroupsQuery = useFabricsFromGroups(
    article.customizables.map((customizable) => customizable?.fabricListId).filter(Boolean) as string[]
  );
  if (getFabricsByGroupsQuery.isError) throw getFabricsByGroupsQuery.error;

  const randomizeFabrics = useCallback(() => {
    if (getFabricsByGroupsQuery.isPending) return;
    article.customizables.forEach((customizable) => {
      if (customizable.type !== 'customizable-part') return;
      const randomFabricIndex = Math.floor(
        Math.random() * getFabricsByGroupsQuery.data[customizable.fabricListId].length
      );
      const randomFabricId = getFabricsByGroupsQuery.data[customizable.fabricListId][randomFabricIndex]._id;
      setValue(`customizations.${customizable.uid}`, randomFabricId);
    });
  }, [article.customizables, getFabricsByGroupsQuery.data, getFabricsByGroupsQuery.isPending, setValue]);

  const toggleFullscren = useCallback(() => {
    if (isFullscreen) {
      router.back();
    } else {
      const current = new URLSearchParams(Array.from(searchParams.entries())); // -> has to use this form
      current.set('fullscreen', 'true');
      router.push(`${pathname}?${current.toString()}`);
    }
  }, [setBodyScrollBlocked, searchParams, isFullscreen, pathname, router]);

  if (getFabricsByGroupsQuery.isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className={className}>
      <h2 className="font-serif text-2xl mb-8 px-4">2. Je personnalise ma couverture</h2>
      <div className="relative">
        <div
          className={clsx(
            'bg-light-100 mx-auto z-[11]',
            !isFullscreen && 'h-[min(600px,60vh)]',
            isFullscreen && 'fixed top-[3.5rem] left-0 w-screen h-[calc(100dvh-3.5rem)]'
          )}
        >
          <Article3DScene
            article={article}
            getFabricsByGroupsQuery={getFabricsByGroupsQuery}
            customizations={watch('customizations') as Record<string, string>}
            canvasRef={canvasRef}
            cameraRef={cameraRef}
            enableZoom={isFullscreen}
          />
        </div>
        <div
          className={clsx('right-4  z-[11]', isFullscreen && 'fixed top-[4.5rem]', !isFullscreen && 'absolute top-4')}
        >
          <button
            id="customize_fullscreen-button"
            type="button"
            aria-hidden
            className={clsx('border-primary-100 border-2 px-4 py-2 bg-light-100')}
            onClick={toggleFullscren}
          >
            {!isFullscreen && <ArrowsPointingOutIcon className="w-6 h-6 text-primary-100" />}
            {isFullscreen && <ArrowsPointingInIcon className="w-6 h-6 text-primary-100" />}
          </button>
          <button
            id="customize_randomize-button"
            type="button"
            aria-hidden
            disabled={getFabricsByGroupsQuery.isPending}
            className={clsx(
              'border-primary-100 border-2 px-4 py-2 block mt-4 bg-light-100',
              getFabricsByGroupsQuery.isPending && 'opacity-50 cursor-not-allowed'
            )}
            onClick={randomizeFabrics}
          >
            <RandomIcon className="w-6 h-6 text-primary-100" />
            <span className="sr-only">Tissus aléatoires</span>
          </button>
        </div>
      </div>
      <button
        id="customize_how-it-works-button"
        className="btn-light ml-auto px-4"
        type="button"
        onClick={() => alert('Coming soon !')}
      >
        Comment ca marche ?
      </button>
      <div className="border-t" aria-hidden></div>
      {(
        article.customizables.filter((customizable) => customizable.type === 'customizable-part') as CustomizablePart[]
      ).map((customizable) => (
        <Option title={customizable.label} key={customizable.uid}>
          <div className="grid grid-cols-[repeat(auto-fill,4rem)] gap-2">
            {getFabricsByGroupsQuery.data[customizable.fabricListId].map((fabric) => (
              <Image
                className={clsx(
                  'w-16 h-16 object-cover object-center',
                  watch(`customizations.${customizable.uid}`) === fabric._id && 'ring-2 ring-primary-100'
                )}
                loader={loader}
                alt=""
                key={fabric._id}
                src={fabric.image.url}
                placeholder={fabric.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={fabric.image.placeholderDataUrl}
                width={64}
                height={64}
                onClick={() => setValue(`customizations.${customizable.uid}`, fabric._id)}
              />
            ))}
          </div>
        </Option>
      ))}
      <button
        id="customize_submit-fabrics-button"
        type="button"
        className={clsx('btn-primary mx-auto mt-8', !canSubmit && 'opacity-50 cursor-not-allowed')}
        disabled={!canSubmit}
        onClick={handleFinished}
      >
        Finaliser
      </button>
    </div>
  );
}

const Option: React.FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="border-b">
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full p-4 items-center">
            <span>{title}</span>
            <ChevronDownIcon className={clsx('w-8 h-8 text-primary-100 transition-transform', open && 'rotate-180')} />
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="p-4 pt-0">{children}</Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  </div>
);

function autoCrop(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext('webgl2');
  if (!context) throw 'Impossible';

  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  context?.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);

  const indexFromCoords = (x: number, y: number) => ((canvas.height - 1 - y) * canvas.width + x) * 4;

  const width = canvas.width;
  const height = canvas.height;
  let left = 0;
  let top = 0;
  let right = width - 1;
  let bottom = height - 1;
  let minRight = width - 1;
  let minBottom = height - 1;

  // top:
  let found = false;
  for (; top <= bottom; top++) {
    for (let x = 0; x < width; x++) {
      if (pixels[indexFromCoords(x, top)] != 0) {
        minRight = x;
        minBottom = top;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // left:
  found = false;
  for (; left < minRight; left++) {
    for (let y = height - 1; y > top; y--) {
      if (pixels[indexFromCoords(left, y)] != 0) {
        minBottom = y;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // bottom:
  found = false;
  for (; bottom > minBottom; bottom--) {
    for (let x = width - 1; x >= left; x--) {
      if (pixels[indexFromCoords(x, bottom)] != 0) {
        minRight = x;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // right:
  found = false;
  for (; right > minRight; right--) {
    for (let y = bottom; y >= top; y--) {
      if (pixels[indexFromCoords(right, y)] != 0) {
        found = true;
        break;
      }
    }
    if (found) break;
  }

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = right - left + 1;
  croppedCanvas.height = bottom - top + 1;
  const croppedContext = croppedCanvas.getContext('2d');
  if (!croppedContext) throw 'Impossible';

  croppedContext.drawImage(
    canvas,
    left,
    top,
    croppedCanvas.width,
    croppedCanvas.height,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  );

  return croppedCanvas;
}
