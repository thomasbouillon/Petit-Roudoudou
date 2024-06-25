import { Popover, PopoverButton, PopoverOverlay, PopoverPanel, Transition } from '@headlessui/react';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo } from 'react';
import RandomIcon from '../../../assets/random.svg';
import useFabricsFromGroups from '../../../hooks/useFabricsFromGroups';
import { Article } from '@couture-next/types';
import Image from 'next/image';
import { useFormContext, useWatch } from 'react-hook-form';
import { AddToCartFormType } from './app';
import { useBlockBodyScroll } from '../../../contexts/BlockBodyScrollContext';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { useRouter, useSearchParams } from 'next/navigation';
import useMeasure from 'react-use-measure';
import useIsMobile from 'apps/storefront/hooks/useIsMobile';
import ReviewsSection from '../../boutique/[articleSlug]/[inStockSlug]/ReviewsSections';
import { CustomizablePart, Fabric } from '@prisma/client';
import { PopupExplainCustomization } from './PopupExplainCustomization';
import dynamic from 'next/dynamic';
import { Spinner } from '@couture-next/ui/Spinner';

type Props = {
  className?: string;
  article: Article;
  onNextStep: () => void;
};

const Article3DScene = dynamic(() => import('./article3DScene'), {
  ssr: false,
  loading: () => (
    <>
      <p className="text-center pt-4">Chargement de l&apos;aperçu...</p>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Spinner className="w-8 h-8" />
      </div>
    </>
  ),
});

export default function FormCustomizableFields({ className, article, onNextStep }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera>(null);

  const { setValue, watch } = useFormContext<AddToCartFormType>();

  const setBodyScrollBlocked = useBlockBodyScroll();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isFullscreen = searchParams.get('fullscreen') === 'true';
  const blockBodyScroll = useBlockBodyScroll();
  const isMobile = useIsMobile(true);

  const customizableVariantId = searchParams.get('variant');
  const customizableVariant = useMemo(
    () => article.customizableVariants.find((variant) => variant.uid === customizableVariantId),
    [article.customizableVariants, customizableVariantId]
  );

  const [selectFabricsContainerRef, selectFabricsContainerSize] = useMeasure({});

  useEffect(() => {
    blockBodyScroll(isMobile);
  }, [blockBodyScroll, isMobile]);

  const selectedFabrics = useWatch<AddToCartFormType, 'customizations'>({
    name: 'customizations',
  });
  const canSubmit = useMemo(() => {
    return (
      customizableVariant?.customizableParts.every((customizableFabric) => !!selectedFabrics[customizableFabric.uid]) ||
      false
    );
  }, [article.customizables, selectedFabrics]);

  const handleFinished = useCallback(async () => {
    if (!canvasRef.current || !cameraRef.current || !customizableVariant) throw 'Impossible';
    cameraRef.current.position.set(0, customizableVariant.threeJsInitialCameraDistance, 0);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const croppedCanvas = canvasRef.current; // autoCrop(canvasRef.current);
    const preview = croppedCanvas.toDataURL('image/png');
    setValue('imageDataUrl', preview, { shouldValidate: true });
    onNextStep();
  }, [onNextStep, setValue]);

  const renderSubmitButton = useCallback(
    () =>
      canSubmit && (
        <button type="button" onClick={handleFinished} className="btn-primary w-full sm:w-auto sm:mx-auto sm:mt-4">
          Continuer
        </button>
      ),
    [canSubmit, handleFinished]
  );

  const getFabricsByGroupQuery = useFabricsFromGroups(
    (customizableVariant?.customizableParts.map((customizable) => customizable?.fabricListId).filter(Boolean) ??
      []) as string[]
  );
  if (getFabricsByGroupQuery.isError) throw getFabricsByGroupQuery.error;

  const randomizeFabrics = useCallback(() => {
    if (getFabricsByGroupQuery.isPending) return;
    customizableVariant?.customizableParts.forEach((customizable) => {
      const randomFabricIndex = Math.floor(
        Math.random() * getFabricsByGroupQuery.data[customizable.fabricListId].length
      );
      const randomFabricId = getFabricsByGroupQuery.data[customizable.fabricListId][randomFabricIndex].id;
      setValue(`customizations.${customizable.uid}`, randomFabricId);
    });
  }, [article.customizables, getFabricsByGroupQuery.data, getFabricsByGroupQuery.isPending, setValue]);

  const toggleFullscren = useCallback(() => {
    if (isFullscreen) {
      router.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('fullscreen', 'true');
      router.push(url.toString());
    }
  }, [setBodyScrollBlocked, searchParams, isFullscreen, router]);

  if (getFabricsByGroupQuery.isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className={clsx(className)}>
      <div className={clsx(isMobile ? 'flex flex-col relative' : 'grid grid-cols-[1fr,1fr] px-4', 'bg-light-100')}>
        <div className="relative overflow-hidden">
          <div
            className={clsx(
              'bg-light-100',
              isMobile && !isFullscreen && 'fixed bottom-0 left-0 right-0 z-10',
              isFullscreen
                ? 'fixed top-[3.5rem] left-0 w-screen h-[calc(100dvh-3.5rem)] z-[11]'
                : ' h-[calc(100dvh-7rem)] sm:max-h-[60svh]'
            )}
            style={{
              paddingBottom: isFullscreen || !isMobile ? 0 : selectFabricsContainerSize.height,
            }}
          >
            <Article3DScene
              article={article}
              getFabricsByGroupsQuery={getFabricsByGroupQuery}
              customizations={watch('customizations') as Record<string, string>}
              canvasRef={canvasRef}
              cameraRef={cameraRef}
              enableZoom={isFullscreen}
              customizableVariant={customizableVariant}
            />
          </div>
          <div
            className={clsx(
              'right-4',
              (isFullscreen || isMobile) && 'fixed z-[20]',
              isFullscreen && isMobile && 'top-[4.5rem]',
              !isFullscreen && isMobile && 'top-[8rem]',
              !isFullscreen && !isMobile && 'absolute top-4'
            )}
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
              disabled={getFabricsByGroupQuery.isPending}
              className={clsx(
                'border-primary-100 border-2 px-4 py-2 block mt-4 bg-light-100',
                getFabricsByGroupQuery.isPending && 'bg-opacity-50 cursor-not-allowed'
              )}
              onClick={randomizeFabrics}
            >
              <RandomIcon className="w-6 h-6 text-primary-100" />
              <span className="sr-only">Tissus aléatoires</span>
            </button>
            <PopupExplainCustomization />
          </div>
        </div>
        <div
          className={
            isFullscreen
              ? 'hidden'
              : isMobile
              ? 'fixed w-full bottom-0 left-0 z-[11]'
              : 'flex items-center max-w-3xl mx-auto w-full'
          }
          ref={selectFabricsContainerRef}
        >
          <SelectFabrics
            fabricsByGroup={getFabricsByGroupQuery.data}
            customizableParts={customizableVariant?.customizableParts ?? []}
            renderSubmitButton={renderSubmitButton}
          />
        </div>
      </div>
      {!isMobile && <ReviewsSection articleId={article.id} />}
    </div>
  );
}

const SelectFabrics: React.FC<{
  customizableParts: CustomizablePart[];
  fabricsByGroup: Record<string, Fabric[]>;
  renderSubmitButton: () => React.ReactNode;
}> = ({ customizableParts, fabricsByGroup, renderSubmitButton }) => {
  const scrollPositionsRef = React.useRef<Record<string, number>>({});

  return (
    <div className="w-full bg-white p-4 shadow-[0_0_10px_0_rgba(0,0,0,0.2)]">
      <div className="flex gap-4 justify-center sm:grid grid-cols-[repeat(auto-fit,12rem)] sm:place-content-center sm:mx-auto">
        {customizableParts.map((customizable, index) => (
          <fieldset className="sm:flex flex-col items-center" key={customizable.uid}>
            <legend className="sm:!w-full text-center mb-4 sr-only sm:not-sr-only">{customizable.label}</legend>
            <SelectFabricPopover
              customizableId={customizable.uid}
              fabrics={fabricsByGroup[customizable.fabricListId]}
              scrollPositionsRef={scrollPositionsRef}
              placeholderText={(index + 1).toString()}
            />
          </fieldset>
        ))}
      </div>
      {renderSubmitButton() || (
        <p className="text-center mt-2 sm:mt-6">
          Choisis tes tissus pour chacune des parties personnalisables ci-dessus
        </p>
      )}
    </div>
  );
};

const SelectFabricPopover: React.FC<{
  fabrics: Fabric[];
  customizableId: string;
  scrollPositionsRef: React.MutableRefObject<Record<string, number>>;
  placeholderText: string;
}> = ({ fabrics, customizableId, scrollPositionsRef, placeholderText }) => {
  return (
    <Popover>
      <PopoverButton>
        <SelectedFabricPreview customizableId={customizableId} fabrics={fabrics} placeholderText={placeholderText} />
      </PopoverButton>
      <PopoverOverlay className="fixed inset-0 bg-black opacity-10" />
      <Transition
        as="div"
        className="transition-transform duration-200 ease-out bg-white fixed bottom-0 left-0 w-full h-[40svh] z-20"
        enterFrom="translate-y-full"
        enterTo="translate-y-0"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-full"
      >
        <PopoverPanel className="h-full">
          {({ close }) => (
            <div className="h-full">
              <button
                className="fixed bottom-[40svh] right-2 bg-white rounded-t-full px-2 pt-2"
                type="button"
                onClick={() => close()}
              >
                <XMarkIcon className="w-6 h-6  text-primary-100 " />
              </button>
              <SelectFabric fabrics={fabrics} customizableId={customizableId} scrollPositionsRef={scrollPositionsRef} />
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

const SelectFabric: React.FC<{
  fabrics: Fabric[];
  customizableId: string;
  scrollPositionsRef: React.MutableRefObject<Record<string, number>>;
}> = ({ fabrics, customizableId, scrollPositionsRef }) => {
  const { setValue } = useFormContext<AddToCartFormType>();
  const fabricsContainerRef = React.useRef<HTMLDivElement>(null);

  // Save scroll position
  useEffect(() => {
    if (!fabricsContainerRef.current) return;
    const container = fabricsContainerRef.current;
    container.scrollTop = scrollPositionsRef.current[customizableId] || 0;

    const listener = () => {
      scrollPositionsRef.current[customizableId] = container.scrollTop;
    };
    container.addEventListener('scroll', listener);
    return () => {
      container.removeEventListener('scroll', listener);
    };
  }, [customizableId, fabricsContainerRef.current]);

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,4rem)] auto-rows-[4rem] gap-2 p-4 h-full overflow-y-scroll"
      ref={fabricsContainerRef}
    >
      {fabrics.map((fabric) => (
        <button type="button" onClick={() => setValue(`customizations.${customizableId}`, fabric.id)} key={fabric.id}>
          <FabricTile fabric={fabric} customizableId={customizableId} />
        </button>
      ))}
    </div>
  );
};

const FabricTile: React.FC<{
  customizableId: string;
  fabric: Fabric;
}> = ({ customizableId, fabric }) => {
  const { watch } = useFormContext<AddToCartFormType>();
  const image = fabric.previewImage ?? fabric.image;

  return (
    <Image
      className={clsx(
        'w-16 h-16 object-cover object-center',
        watch(`customizations.${customizableId}`) === fabric.id && 'outline outline-primary-100'
      )}
      loader={loader}
      alt=""
      src={image.url}
      placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
      blurDataURL={image.placeholderDataUrl ?? undefined}
      width={64}
      height={64}
    />
  );
};

const SelectedFabricPreview: React.FC<{
  customizableId: string;
  fabrics: Fabric[];

  placeholderText: string;
}> = ({ customizableId, fabrics, placeholderText }) => {
  const { watch } = useFormContext<AddToCartFormType>();
  const selectedId = watch(`customizations.${customizableId}`) as string | undefined;
  const selected = fabrics.find((fabric) => fabric.id === selectedId);

  if (!selected)
    return (
      <div className="w-16 h-16 bg-light-100 flex items-center justify-center">
        <span>{placeholderText}</span>
      </div>
    );

  const image = selected.previewImage ?? selected.image;

  return (
    <Image
      className="w-16 h-16 object-cover object-center"
      loader={loader}
      alt=""
      key={selected.id}
      src={image.url}
      placeholder={image.placeholderDataUrl ? 'blur' : 'empty'}
      blurDataURL={image.placeholderDataUrl ?? undefined}
      width={64}
      height={64}
    />
  );
};

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
