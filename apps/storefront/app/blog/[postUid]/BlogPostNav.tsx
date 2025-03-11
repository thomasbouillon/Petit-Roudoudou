'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  titleCount: number;
};

export default function BlogPostNav({ titleCount }: Props) {
  const [titles, setTitles] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const titles = document.getElementsByTagName('h2');
    const titlesArray = Array.from(titles)
      .filter((title) => title.id.startsWith('heading'))
      .map((title) => title.textContent || '');
    setTitles(titlesArray);
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div>
        <div className="border p-4 my-6">
          <h2 className="font-bold text-center">Table des matières</h2>
          <nav aria-labelledby="blog-post-nav-label">
            <div className="relative">
              <ul className="space-y-2 pt-4" aria-hidden>
                {new Array(Math.min(titleCount, 3)).fill(null).map((_, i) => (
                  <li className="placeholder h-6 bg-gray-100" key={i}></li>
                ))}
              </ul>
              {titleCount > 4 && <span className="btn-light mx-auto">Voir plus</span>}
            </div>
          </nav>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="border p-4 my-6">
        <h2 id="blog-post-nav-label" className="font-bold text-center">
          Table des matières
        </h2>
        <nav aria-labelledby="blog-post-nav-label">
          <div className="relative">
            <ul className={clsx('space-y-2 pt-4', !expanded && titleCount > 4 && 'line-clamp-3')}>
              {titles.map((title, index) => (
                <li key={title + index}>
                  <Link href={`#heading-${index + 1}`} className="underline">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {titleCount > 4 && (
            <div aria-hidden>
              <button type="button" onClick={() => setExpanded(!expanded)} className="btn-light mx-auto">
                {expanded ? 'Réduire' : 'Voir plus'}
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
