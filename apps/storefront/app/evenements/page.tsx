'use client';

import { StyledWrapper } from '@couture-next/ui';
import { Event, monthFromId } from '../../directus';
import React, { useMemo } from 'react';
import useCMS from '../../hooks/useCMS';

export default function Page() {
  const { data: events, error } = useCMS<Event[]>('events');
  if (error) throw error;

  const groupedByMonth = useMemo(
    () =>
      events?.reduce((acc, event) => {
        if (!acc[event.month]) acc[event.month] = [];
        acc[event.month].push(event);
        return acc;
      }, {} as Record<number, Event[]>),
    [events]
  );

  if (!groupedByMonth) return null;

  const renderMonthEvents = (monthId: string, events: Event[]) => (
    <div>
      <h2 className="text-2xl text-primary-100">
        {monthFromId(parseInt(monthId))}
      </h2>
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

  return (
    <div className="-mb-8 bg-light-100 pt-8">
      <h1 className="font-serif text-3xl text-center mb-8">Evènements</h1>
      <div className="flex items-center flex-col">
        <div className="space-y-4">
          {Object.entries(groupedByMonth).map(([monthId, events], i) =>
            i % 2 === 1 ? (
              <StyledWrapper key={monthId} className="px-8 py-4 bg-white">
                {renderMonthEvents(monthId, events)}
              </StyledWrapper>
            ) : (
              <div key={monthId} className="px-8">
                {renderMonthEvents(monthId, events)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
