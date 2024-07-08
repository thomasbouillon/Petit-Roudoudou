import { WorkshopSession } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-server';
import { StorageImage } from '../StorageImage';
import { StyledWrapper } from '@couture-next/ui/StyledWrapper';
import { CalendarIcon, CurrencyEuroIcon, MapPinIcon } from '@heroicons/react/24/solid';
import BookSessionButton from './BookSessionButton';
import { generateMetadata } from '@couture-next/utils';
import { routes } from '@couture-next/routing';

export const metadata = generateMetadata({
  title: 'Ateliers bébé Nancy | Boutique éphémère',
  description:
    'Du 10 juillet au 07 août, participez à nos ateliers de l&apos;univers bébé, Inscription en ligne pour la boutique éphémère de Nancy',
  alternates: {
    canonical: routes().workshopSessions(),
  },
});

export default async function Page() {
  const sessions = await trpc.workshopSessions.list
    .query()
    .then((res) => res.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));

  return (
    <div>
      <h1 className="font-serif text-3xl text-center mt-12 mb-4">Ateliers boutique éphémère</h1>
      <StyledWrapper className="bg-light-100 py-4">
        <ul>
          {sessions.map((session) => (
            <WorkshopSessionLine key={session.id} workshopSession={session} />
          ))}
          {sessions.length === 0 && (
            <li>
              <p className="text-center">Aucun atelier n'est prévu pour le moment, revenez plus tard</p>
            </li>
          )}
        </ul>
      </StyledWrapper>
    </div>
  );
}

type WorkshopSessionProps = {
  workshopSession: WorkshopSession;
};
function WorkshopSessionLine({ workshopSession }: WorkshopSessionProps) {
  return (
    <li className="p-4">
      <div className="flex flex-col sm:flex-row justify-center">
        <StorageImage
          src={workshopSession.image.uid}
          alt={workshopSession.title}
          width={350}
          height={350}
          className="object-contain object-center"
        />
        <div className="p-4 space-y-2">
          <h2 className="font-serif text-2xl mb-4">{workshopSession.title}</h2>
          <WorkshopSessionDate startDate={workshopSession.startDate} endDate={workshopSession.endDate} />
          <div>
            <MapPinIcon className="h-6 w-6 inline-block mr-2" />
            <p className="inline-block">{workshopSession.location}</p>
          </div>
          <div>
            <CurrencyEuroIcon className="h-6 w-6 inline-block mr-2" />
            <p className="inline-block">{workshopSession.price.toFixed(2)} €</p>
          </div>
          <p className="max-w-prose space-y-1">
            {workshopSession.description.split('\n').map((p, i) => (
              <span key={i} className="block">
                {p}
              </span>
            ))}
          </p>
          <div className="flex justify-end items-center gap-4">
            {workshopSession.remainingCapacity > 0 ? (
              <>
                <p className="text-primary-100">Il reste {workshopSession.remainingCapacity} places</p>
                <BookSessionButton workshopSessionId={workshopSession.id} endAt={workshopSession.endDate} />
              </>
            ) : (
              <p className="text-red-500">Complet</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

type WorkshopSessionDateProps = {
  startDate: Date;
  endDate: Date;
};
function WorkshopSessionDate({ startDate, endDate }: WorkshopSessionDateProps) {
  const localDateStringOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  } as const;

  if (startDate.toDateString() === endDate.toDateString()) {
    return (
      <div>
        <CalendarIcon className="h-6 w-6 inline-block mr-2" />
        <p className="inline-block">{startDate.toLocaleDateString('fr-FR', localDateStringOptions)}</p> |{' '}
        <p className="inline-block">
          {startDate.toLocaleTimeString('fr-FR')} - {endDate.toLocaleTimeString('fr-FR')}
        </p>
      </div>
    );
  }
  return (
    <p>
      <CalendarIcon className="h-6 w-6 inline-block mr-2" />
      {startDate.toLocaleDateString('fr-FR', {
        ...localDateStringOptions,
        hour: 'numeric',
        minute: 'numeric',
      })}{' '}
      - {endDate.toLocaleDateString('fr-FR', { ...localDateStringOptions, hour: 'numeric', minute: 'numeric' })}
    </p>
  );
}
