'use client';

import { WithDecorativeDotsWrapper } from '@couture-next/ui';

export function LinksFromCMSPlaceholder() {
  return (
    <WithDecorativeDotsWrapper dotsPosition="top-right">
      <div className="flex flex-col max-w-lg px-4 gap-2 mx-auto">
        <p className="sr-only">Chargement des accès rapides</p>
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="placeholder aspect-[350/120] relative" key={i} aria-hidden>
            <div className="btn-primary min-w-56 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-transparent">Chargement</span>
            </div>
          </div>
        ))}
      </div>
    </WithDecorativeDotsWrapper>
  );
}
