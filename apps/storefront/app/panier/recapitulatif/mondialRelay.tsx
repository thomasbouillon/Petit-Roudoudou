import { HTMLProps, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { PickupPoint } from '@couture-next/shipping';
import useIsMobile from '../../../hooks/useIsMobile';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { CallListPickUpPointsPayload, CallListPickUpPointsResponse } from '@couture-next/types';
import DetailsFormFields from './detailsFormFields';
import { UseFormRegister } from 'react-hook-form';
import { FinalizeFormType } from './page';

const MondialRelayMap = dynamic(() => import('./mondialRelayMap').then((bundle) => bundle.MondialRelayMap), {
  ssr: false,
});

type Props = {
  register: UseFormRegister<FinalizeFormType>;
  value?: string;
  onChange: (pickupPointId?: string) => void;
};

export default function MondialRelay({ register, value, onChange }: Props) {
  const [futurezipCodeSearch, setFutureZipCodeSearch] = useState('');
  const [zipCodeSearch, setZipCodeSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const [forceClosed, setForceClosed] = useState(false);
  const isMobile = useIsMobile(true);
  const [stickZipCodeInputToLeft, setStickZipCodeInputToLeft] = useState(false);

  const functions = useFunctions();
  const fetchPickupPoints = httpsCallable<CallListPickUpPointsPayload, CallListPickUpPointsResponse>(
    functions,
    'callListPickupPoints'
  );

  const {
    data: relayPoints,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['relayPoints', zipCodeSearch],
    queryFn: async () => {
      const pointsRes = await fetchPickupPoints({ zipCode: zipCodeSearch });
      const current = pointsRes.data.find((p) => p.code === value);
      if (!current || !pointsRes.data.some((p) => p.code === current.code)) {
        onChange(undefined);
      }
      return pointsRes.data;
    },
    enabled: !!zipCodeSearch,
  });
  if (error) throw error;

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

  const handleSelectedChange = (p?: PickupPoint) => {
    onChange(p?.code);
    // setValue(
    //   'relayPoint',
    //   p
    //     ? {
    //         code: p.code,
    //         zipCode: '' + p.zipcode,
    //       }
    //     : undefined
    // );
    // if (getValues('city') === '' && p?.city && getValues('zipCode') === '' && p?.zipcode) {
    //   setValue('city', p.city);
    //   setValue('zipCode', '' + p.zipcode);
    // }
  };

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
            <p className="text-center underline mb-2">Recherchez un point relais</p>
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
            pickupPoints={relayPoints ?? []}
            className={clsx('z-10 w-full', !futurezipCodeSearch && 'sm:hidden')}
            onSelectedChange={handleSelectedChange}
            onClose={() => setForceClosed(true)}
            // defaultValue={relayPoints?.find((p) => p.code === watch('relayPoint.code'))}
          />
        </>
      )}

      {value && (
        <SelectionRecap
          p={relayPoints?.find((p) => p.code === value)}
          className="mb-4 sm:hidden mx-auto flex flex-col items-center"
        />
      )}
      {!searchTimeout && forceClosed && (
        <button
          type="button"
          className={clsx('mx-auto block', value ? 'btn-secondary' : 'btn-primary')}
          onClick={() => setForceClosed(false)}
        >
          Choisir un {!!value && 'autre '}
          point relais
        </button>
      )}

      {/* additional informations */}
      {!!value && (
        <div ref={additionalInformations} className="max-w-sm md:max-w-lg mx-auto">
          <h2 className="text-center mt-8 mb-2 underline">Informations supplémentaires sur le destinataire</h2>
          <DetailsFormFields register={register} baseFieldPath="shipping" />
          {/* {!formState.isValid && formState.isDirty && (
            <div className="text-red-500 text-center">Veuillez vérifier les champs</div>
          )} */}
        </div>
      )}
    </div>
  );
}

const SelectionRecap = ({ p, ...props }: HTMLProps<HTMLDivElement> & { p?: PickupPoint }) => {
  if (!p) return null;
  return (
    <div {...props}>
      <div>
        {/* <p>Point relais sélectionné:</p> */}
        <p className="font-semibold">{p.name}</p>
        <p>{p.address}</p>
        <p>
          {p.zipcode} {p.city}
        </p>
      </div>
    </div>
  );
};
