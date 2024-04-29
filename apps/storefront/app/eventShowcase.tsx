import { monthFromId, type Event, fetchFromCMS } from '../directus';
import React, { HTMLProps } from 'react';

export async function EventShowcase() {
  const events = await fetchFromCMS<Event[]>('events', { fields: '*.*' }).then((events) =>
    events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  );
  /*Groupage des evenements du mois en cours, supprime les evenements fini*/
  const groupedByThisMonth = events.reduce((acc, event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const actualMonth = date.getMonth() + 1;
    if (start >= date && start.getMonth() === date.getMonth()) {
      if (!acc[actualMonth]) acc[actualMonth] = [];
      acc[actualMonth].push(event);
    } else if (end >= date && start.getMonth() <= date.getMonth()) {
      if (!acc[actualMonth]) acc[actualMonth] = [];
      acc[actualMonth].push(event);
    }
    return acc;
  }, {} as Record<number, Event[]>);

  return (
    <>
      <div className="relative bg-light-100">
        <h1 className="font-serif text-4xl text-center">À ne pas rater ce mois-ci !</h1>
        <div className="flex flex-col items-center">
          <div className="">
            {Object.entries(groupedByThisMonth).map(([monthId, events]) => (
              <div key={monthId} className="px-12 py-10  ">
                <EventsRow title={monthFromId(parseInt(monthId))} events={events} />
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <h2 className="text-2xl font-semibold text-primary-100 ml-0 ">{title}</h2>
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
