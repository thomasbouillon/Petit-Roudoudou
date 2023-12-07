import { HTMLProps, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L, { Map } from 'leaflet';
import clsx from 'clsx';
import MarkerImg from '../../../assets/marker.png';
import MarkerHighlightedImg from '../../../assets/marker-highlighted.png';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PickupPoint } from '@couture-next/shipping';

export type MondialRelayMapProps = {
  pickupPoints: PickupPoint[];
  defaultValue?: PickupPoint;
  onSelectedChange?: (selected?: PickupPoint) => void;
  onClose?: () => void;
  renderHeader?: () => React.ReactNode;
  loading?: boolean;
};

export function MondialRelayMap({
  pickupPoints,
  defaultValue,
  onSelectedChange,
  onClose,
  renderHeader,
  loading,
  ...htmlProps
}: Omit<HTMLProps<HTMLDivElement>, 'defaultValue'> & MondialRelayMapProps) {
  useEffect(() => {
    // add leaflet css
    if (typeof window === 'undefined' || !!document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css';
    link.crossOrigin = '';
    link.integrity = 'sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==';
    document.head.appendChild(link);
  }, []);

  const map = useRef<Map>(null);
  const pickupPointsList = useRef<HTMLUListElement>(null);
  const [selected, setSelected] = useState<PickupPoint | undefined>(defaultValue);
  useEffect(() => {
    // deselect if selected point is not in list anymore
    if (!selected || pickupPoints.some((p) => p.code === selected.code)) return;
    setSelected(undefined);
    onSelectedChange && onSelectedChange(undefined);
  }, [pickupPoints, selected]);

  const handleRequestFocus = (point: PickupPoint, moveTo?: boolean) => {
    onSelectedChange && onSelectedChange(point);
    setSelected(point);
    if (moveTo !== false) map.current?.setView([point.latitude, point.longitude], 13);
    const li = document.getElementById('mr-map-point-' + point.code);
    if (li) scrollIntoViewIfNeeded(li);
  };

  useEffect(() => {
    // scroll to default value in list on mounted
    if (!defaultValue) return;
    const li = document.getElementById('mr-map-point-' + defaultValue.code);
    if (li) scrollIntoViewIfNeeded(li);
  }, []);

  const pointBounds = useMemo(() => {
    const bounds = pickupPoints.reduce(
      (acc, point) => {
        if (acc[0] === null || point.latitude < acc[0]) acc[0] = point.latitude;
        if (acc[1] === null || point.longitude < acc[1]) acc[1] = point.longitude;
        if (acc[2] === null || point.latitude > acc[2]) acc[2] = point.latitude;
        if (acc[3] === null || point.longitude > acc[3]) acc[3] = point.longitude;
        return acc;
      },
      [null, null, null, null] as (null | number)[]
    );
    if (bounds[0] === null || bounds[1] === null || bounds[2] === null || bounds[3] === null) return undefined;
    return [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ] satisfies [[number, number], [number, number]];
  }, [pickupPoints]);

  return (
    <div
      {...htmlProps}
      className={clsx(
        'max-sm:h-screen max-sm:fixed max-sm:z-[101] max-sm:bg-white max-sm:inset-0 sm:flex sm:w-full',
        htmlProps.className
      )}
    >
      <div className="max-sm:h-[50vh] sm:h-96 px-2 max-sm:py-2 w-full max-w-sm flex flex-col mx-auto">
        {!!renderHeader && renderHeader()}
        {!!loading && <PointListPlaceholder />}
        {!loading && pickupPoints.length > 0 && (
          <>
            <p className="mb-2 px-4 text-center">Choisissez votre point relais</p>
            <ul
              className="w-full flex-grow overflow-y-scroll flex flex-col gap-1 justify-between shadow-inner-y"
              ref={pickupPointsList}
            >
              {pickupPoints.map((pickupPoint, index) => (
                <li
                  className={clsx('w-full border', selected?.code === pickupPoint.code && 'border-black')}
                  key={pickupPoint.code}
                  onClick={() => handleRequestFocus(pickupPoint)}
                  id={'mr-map-point-' + pickupPoint.code}
                >
                  <button className="h-full w-full flex items-center" type="button">
                    <div
                      className={clsx(
                        'h-full flex items-center border-r px-2 py-4 ',
                        selected?.code === pickupPoint.code && 'border-black bg-black text-white'
                      )}
                    >
                      <span>{index + 1}</span>
                    </div>
                    <div className="py-4 px-2 text-start">
                      <p className="font-bold">{pickupPoint.name}</p>
                      <p>{pickupPoint.address}</p>
                      <p>
                        {pickupPoint.zipcode} {pickupPoint.city}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {!loading && (
        <MapContainer
          bounds={
            pointBounds ?? [
              [48.805573, 2.204199],
              [48.825573, 2.234199],
            ]
          }
          scrollWheelZoom={true}
          className="max-sm:w-screen sm:flex-grow max-sm:h-[50vh] sm:h-96 z-0"
          ref={map}
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickupPoints.map((pickupPoint, index) => (
            <Marker
              position={[pickupPoint.latitude, pickupPoint.longitude]}
              icon={iconWithIndex(index + 1, pickupPoint.code === selected?.code)}
              zIndexOffset={pickupPoint.code === selected?.code ? pickupPoints.length : 0}
              eventHandlers={{
                click: () => handleRequestFocus(pickupPoint, false),
              }}
              key={pickupPoint.code}
            />
          ))}
        </MapContainer>
      )}
      {loading && (
        <div
          className={clsx(
            'max-sm:w-screen sm:flex-grow max-sm:h-[50vh] sm:h-96 z-0 bg-gray-100 overflow-hidden placeholder'
          )}
        ></div>
      )}
      <button
        type="button"
        className="fixed right-4 top-4 p-1 rounded-full bg-white border shadow sm:hidden"
        onClick={onClose}
      >
        <span className="sr-only">Fermer la popup de choix de point relais</span>
        <XMarkIcon className="w-8 h-8" />
      </button>
      {!!selected && (
        <button
          type="button"
          className="fixed bottom-0 left-0 w-full z-10 btn-primary py-4 sm:hidden"
          onClick={onClose}
        >
          Valider
        </button>
      )}
    </div>
  );
}

const PointListPlaceholder = () => (
  <div className="h-full overflow-hidden shadow-inner-y">
    <p className="mb-2 px-4 text-center">Choisissez votre point relais</p>
    <div className="w-full flex-grow flex flex-col gap-1 shrink-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={clsx('w-full border h-24 relative bg-gray-100 placeholder')}>
          <div className={clsx('h-full flex items-center border-r px-2 py-4 w-6')}>
            <span>{i}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const iconWithIndex = (index: number, highlight: boolean) =>
  L.divIcon({
    className: 'bg-transparent',
    iconAnchor: [13, 41],
    popupAnchor: [0, -41],
    html: `<div class='relative'><img class="marker-icon" src="${imgToSrc(
      highlight ? MarkerHighlightedImg : MarkerImg
    )}" /><span class='absolute top-1 left-full -translate-x-1/2 text-xl font-bold'>${index}</span></div>`,
  });

const imgToSrc = (img: string | { src: string }) => (typeof img === 'string' ? img : img.src);

function scrollIntoViewIfNeeded(target: HTMLElement) {
  if (target.parentElement === null)
    return target.scrollIntoView({
      behavior: 'smooth',
    });

  const targetRect = target.getBoundingClientRect();
  const parentRect = target.parentElement.getBoundingClientRect();

  if (targetRect.bottom > parentRect.bottom || targetRect.top < parentRect.top) {
    target.parentElement.scrollBy({
      top:
        targetRect.bottom > parentRect.bottom ? targetRect.bottom - parentRect.bottom : targetRect.top - parentRect.top,
      behavior: 'smooth',
    });
  }
}
