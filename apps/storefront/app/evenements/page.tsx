import { routes } from '@couture-next/routing';
import { monthFromId, type Event, fetchFromCMS } from '../../directus';
import { DecorativeDots } from '@couture-next/ui/DecorativeDots';
import { generateMetadata } from '@couture-next/utils';
import React, { HTMLProps } from 'react';

export const metadata = generateMetadata({
  title: 'Évènements',
  alternates: { canonical: routes().events().index() },
  description:
    'Retrouvez tous les événements en lien avec Petit Roudoudou. Ne manquez pas nos prochains marchés, salons ou expositions.',
});

export default async function Page() {
  const events = await fetchFromCMS<Event[]>('events', { fields: '*.*' }).then((events) =>
    events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  );
  /*Groupage des evenement dans les mois par rapport à leur date de début et fin, supprime les evenements fini*/
  const groupedByMonth = events.reduce((acc, event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const actualMonth = date.getMonth() + 1;
    const startMonth = start.getMonth() + 1;
    if (start >= date) {
      if (!acc[startMonth]) acc[startMonth] = [];
      acc[startMonth].push(event);
    } else if (end >= date) {
      if (!acc[actualMonth]) acc[actualMonth] = [];
      acc[actualMonth].push(event);
    }
    return acc;
  }, {} as Record<number, Event[]>);

  return (
    <>
      <div className=" py-9    relative bg-light-100">
        <h1 className="font-serif text-3xl text-center">Evènements</h1>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr]">
          <DecorativeDots className="mx-auto hidden xl:block" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))]  px-4 py-4 xl:max-w-6xl mx-auto ">
            {Object.entries(groupedByMonth).map(([monthId, events]) => (
              <div key={monthId} className="px-12 py-10 border-b-2   border-primary-100  ">
                <EventsRow title={monthFromId(parseInt(monthId))} events={events} />
              </div>
            ))}
          </div>
          <DecorativeDots className="mx-auto mt-auto hidden xl:block" />
        </div>
      </div>
      <div className=" mb-8 sm:mb-1 sm:triangle-bottom bg-light-100 "></div>
    </>
  );
}

const EventsRow: React.FC<HTMLProps<HTMLDivElement> & { title: string; events: Event[] }> = ({
  title,
  events,
  ...props
}) => {
  return (
    <div {...props}>
      <h2 className="text-2xl font-semibold text-primary-100 text-center">{title}</h2>
      <ul className="mt-4 space-y-4">
        {events.map((event) => (
          <li key={event.startAt + event.description}>
            <EventsItem event={event} />
          </li>
        ))}
      </ul>
    </div>
  );
};
function EventsItem(props: { event: Event }) {
  const startDate = new Date(props.event.startAt);
  const endDate = new Date(props.event.endAt);
  const actualDate = new Date();
  let startDay = startDate.getDate().toString().padStart(2, '0');
  let endDay = endDate.getDate().toString().padStart(2, '0');
  let duration = '';
  /*Affiche le mois en + du jour de début ou de fin uniquement si le mois n'est pas dans sa catégorie*/
  if (endDate.getMonth() > actualDate.getMonth() && startDate.getMonth() !== endDate.getMonth()) {
    endDay = endDay + ' ' + monthFromId(endDate.getMonth() + 1);
  }
  if (startDate.getMonth() < actualDate.getMonth() && endDate.getMonth() >= actualDate.getMonth()) {
    startDay = startDay + ' ' + monthFromId(startDate.getMonth() + 1);
  }
  if (startDate.getDate() == endDate.getDate() && startDate.getMonth() == endDate.getMonth()) {
    duration = startDay;
  } else {
    duration = startDay + '-' + endDay;
  }

  return (
    <>
      <h3 className="mb-1">
        <span className="font-bold">{duration}</span>{' '}
        <span className="underline underline-offset-4    decoration-primary-100">{props.event.city}</span>
      </h3>
      <p>{props.event.description}</p>
    </>
  );
}
