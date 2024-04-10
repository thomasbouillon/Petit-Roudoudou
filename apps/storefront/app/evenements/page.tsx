import { routes } from '@couture-next/routing';
import { monthFromId, type Event, fetchFromCMS } from '../../directus';
import { DecorativeDots, StyledWrapper, WithDecorativeDotsWrapper } from '@couture-next/ui';
import { generateMetadata } from '@couture-next/utils';
import React, { HTMLProps } from 'react';

export const metadata = generateMetadata({
  title: 'Évènements',
  alternates: { canonical: routes().events().index() },
  description: 'Retrouvez tous les évènements en lien avec Petit roudoudou.',
});

export default async function Page() {
  const events = await fetchFromCMS<Event[]>('events', { fields: '*.*' });

  const groupedByMonth = events.reduce((acc, event) => {
    if (!acc[event.month]) acc[event.month] = [];
    acc[event.month].push(event);
    return acc;
  }, {} as Record<number, Event[]>);

  return (
    <div className="py-8 mb-16 relative">
      <h1 className="font-serif text-3xl text-center mb-8">Evènements</h1>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr]">
        <DecorativeDots className="mx-auto hidden xl:block" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 px-4 py-16 xl:max-w-6xl mx-auto">
          {Object.entries(groupedByMonth).map(([monthId, events]) => (
            <div key={monthId} className="px-12 py-8 bg-light-100">
              <EventsRow title={monthFromId(parseInt(monthId))} events={events} />
            </div>
          ))}
        </div>
        <DecorativeDots className="mx-auto mt-auto hidden xl:block" />
      </div>
    </div>
  );
}

const EventsRow: React.FC<HTMLProps<HTMLDivElement> & { title: string; events: Event[] }> = ({
  title,
  events,
  ...props
}) => (
  <div {...props}>
    <h2 className="text-2xl text-primary-100 text-center">{title}</h2>
    <ul className="mt-6 space-y-4">
      {events.map((event) => (
        <li key={event.day + event.description}>
          <p>
            <span className="underline block">
              {event.day} - {event.city}
            </span>{' '}
            {event.description}
          </p>
        </li>
      ))}
    </ul>
  </div>
);
