import { HTMLProps, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { BoxtalCarrier, PickupPoint } from '@couture-next/shipping';
import useIsMobile from '../../../../hooks/useIsMobile';
import dynamic from 'next/dynamic';
import DetailsFormFields from '../detailsFormFields';
import { FinalizeFormType } from '../page';
import { trpc } from 'apps/storefront/trpc-client';
import { useController, useWatch } from 'react-hook-form';

const MondialRelayMap = dynamic(() => import('./mondialRelayMap').then((bundle) => bundle.MondialRelayMap), {
  ssr: false,
});

export default function ChoosePickupPoint() {
  const selectedCountry = useWatch<FinalizeFormType, 'shipping.country'>({ name: 'shipping.country' });
  const { field } = useController<FinalizeFormType, 'shipping.pickupPoint'>({ name: 'shipping.pickupPoint' });

  const [futurezipCodeSearch, setFutureZipCodeSearch] = useState('');
  const [zipCodeSearch, setZipCodeSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const [forceClosed, setForceClosed] = useState(false);
  const isMobile = useIsMobile(true);
  const [stickZipCodeInputToLeft, setStickZipCodeInputToLeft] = useState(false);

  const carrierId = useWatch<FinalizeFormType, 'shipping.carrierId'>({ name: 'shipping.carrierId' });

  const listPickupPointsQuery = trpc.shipping.listPickupPointsForCarrier.useQuery(
    {
      carrierId: carrierId as BoxtalCarrier,
      country: selectedCountry,
      zipCode: zipCodeSearch,
    },
    {
      enabled: !!zipCodeSearch && !!selectedCountry && !!carrierId,
    }
  );

  // Reset pickup point if no longer in the list
  useEffect(() => {
    field.onChange(null);
  }, []);

  if (listPickupPointsQuery.isError) throw listPickupPointsQuery.error;

  const { isLoading, data: pickupPoints } = listPickupPointsQuery;

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setZipCodeSearch(e.target.value);
      setSearchTimeout(undefined);
    }, 500);
    setSearchTimeout(timeout);
    setFutureZipCodeSearch(e.target.value);
    setStickZipCodeInputToLeft(true);
  };

  const handleSelectedChange = useCallback(
    (p?: PickupPoint) => {
      field.onChange({
        ...p,
        zipCode: p?.zipcode,
      });
    },
    [field.onChange]
  );

  useEffect(() => {
    if (!forceClosed && isMobile) setForceClosed(true);
    else if (forceClosed && !isMobile) setForceClosed(false);
  }, [isMobile]);

  const additionalInformations = useCallback((node: HTMLDivElement) => {
    if (node && window.innerWidth > 640) {
      // additional informations appeard
      if (node.getBoundingClientRect().top < window.innerHeight - 100) return;
      window.scrollBy({
        top: node.getBoundingClientRect().top - window.innerHeight + 100,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div className="px-4 z-[101]">
      {!forceClosed && (
        <>
          <div className={clsx('max-w-sm mb-4 max-sm:hidden', !stickZipCodeInputToLeft && 'mx-auto')}>
            <p className="text-center underline mb-2">Recherche un point relais</p>
            <label htmlFor="zipCode-search">Code postal</label>
            <input
              onChange={handleZipCodeChange}
              defaultValue={futurezipCodeSearch}
              autoComplete="false"
              type="text"
              id="zipCode-search"
              className="border w-full p-2"
            />
          </div>
          <MondialRelayMap
            loading={!!futurezipCodeSearch && (!!searchTimeout || isLoading)}
            renderHeader={() => (
              <div className="max-w-xs mx-auto mb-4 sm:hidden">
                <p className="text-center mb-2">Recherchez un point relais</p>
                <label htmlFor="zipCode-search">Code postal</label>
                <input
                  onChange={handleZipCodeChange}
                  defaultValue={futurezipCodeSearch}
                  autoComplete="false"
                  type="text"
                  id="zipCode-search"
                  className="border w-full p-2"
                />
              </div>
            )}
            pickupPoints={pickupPoints ?? []}
            className={clsx('z-10 w-full', !futurezipCodeSearch && 'sm:hidden')}
            onSelectedChange={handleSelectedChange}
            onClose={() => setForceClosed(true)}
            // defaultValue={pickupPoints?.find((p) => p.code === watch('pickupPoint.code'))}
          />
        </>
      )}
      <SelectionRecap className="mb-4 sm:hidden mx-auto flex flex-col items-center" />
      {!searchTimeout && forceClosed && (
        <button
          type="button"
          className={clsx('mx-auto block', field.value ? 'btn-secondary' : 'btn-primary')}
          onClick={() => setForceClosed(false)}
        >
          Choisir un {!!field.value && 'autre '}
          point relais
        </button>
      )}

      {/* additional informations */}
      {!!field.value && (
        <div ref={additionalInformations} className="max-w-sm md:max-w-lg mx-auto">
          <h2 className="text-center mt-8 mb-2 underline">Informations supplémentaires sur le destinataire</h2>
          <DetailsFormFields baseFieldPath="shipping" />
          {/* {!formState.isValid && formState.isDirty && (
            <div className="text-red-500 text-center">Veuillez vérifier les champs</div>
          )} */}
        </div>
      )}
    </div>
  );
}

const SelectionRecap = (htmlProps: HTMLProps<HTMLDivElement>) => {
  const pickupPoint = useWatch<FinalizeFormType, 'shipping.pickupPoint'>({ name: 'shipping.pickupPoint' });
  if (!pickupPoint) return null;
  return (
    <div {...htmlProps}>
      <div>
        {/* <p>Point relais sélectionné:</p> */}
        <p className="font-semibold">{pickupPoint.name}</p>
        <p>{pickupPoint.address}</p>
        <p>
          {pickupPoint.zipCode} {pickupPoint.city}
        </p>
      </div>
    </div>
  );
};
