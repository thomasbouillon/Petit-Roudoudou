'use client';

import { useState } from 'react';

export default function ReadMore({ children }: { children: string }) {
  const text = children;
  console.log(text);
  const [isReadMore, setIsReadMore] = useState(true);
  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };
  if (text && text.length > 100) {
    return (
      <>
        {isReadMore ? text.slice(0, 115) : text}
        <span onClick={toggleReadMore} className="text-primary-100 font-semibold">
          {isReadMore ? '... Voir plus' : '  Réduire'}
        </span>
      </>
    );
  }
  if (text) {
    return <>{text}</>;
  }
  return null;
}
