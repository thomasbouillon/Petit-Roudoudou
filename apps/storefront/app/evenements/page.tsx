import { monthFromId, type Event, fetchFromCMS } from '../../directus';
import { StyledWrapper } from '@couture-next/ui';
import { generateMetadata } from '@couture-next/utils';
import React, { HTMLProps } from 'react';

export const metadata = generateMetadata({
  title: 'Évènements',
  description: 'Retrouvez tous les évènements en lien avec Petit roudoudou.',
});

export const dynamic = 'force-dynamic';

export default async function Page() {
  const events = await fetchFromCMS<Event[]>('events', { fields: '*.*' });

  const groupedByMonth = events.reduce((acc, event) => {
    if (!acc[event.month]) acc[event.month] = [];
    acc[event.month].push(event);
    return acc;
  }, {} as Record<number, Event[]>);

  return (
    <div className="-mb-8 bg-light-100 pt-8">
      <h1 className="font-serif text-3xl text-center mb-8">Evènements</h1>
      <div className="flex items-center flex-col">
        <div className="space-y-4">
          {Object.entries(groupedByMonth).map(([monthId, events], i) =>
            i % 2 === 1 ? (
              <StyledWrapper key={monthId} className="px-8 py-4 bg-white">
                <EventsRow title={monthFromId(parseInt(monthId))} events={events} />
              </StyledWrapper>
            ) : (
              <EventsRow key={monthId} className="px-8" title={monthFromId(parseInt(monthId))} events={events} />
            )
          )}
        </div>
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
    <h2 className="text-2xl text-primary-100">{title}</h2>
    <ul className="mt-2 space-y-4">
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
