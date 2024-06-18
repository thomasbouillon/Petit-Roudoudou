'use client';
import { useState, useEffect, useRef } from 'react';

export default function ReadMore({ children, maxLines = 5 }: { children: string; maxLines: number }) {
  const [isReadMore, setIsReadMore] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
      const fullHeight = textRef.current.scrollHeight;
      const maxTextHeight = lineHeight * maxLines;
      setShowButton(fullHeight > maxTextHeight);
    }
  }, [children, maxLines]);

  const toggleReadMore = () => {
    setIsReadMore(!isReadMore);
  };

  const baseClass = 'overflow-hidden empty:hidden ';
  const clampClass = isReadMore ? `line-clamp-${maxLines}` : 'line-clamp-none';

  return (
    <>
      <p ref={textRef} className={`${baseClass} ${clampClass}`}>
        {children}
      </p>
      {showButton && (
        <button onClick={toggleReadMore} className="text-primary-100 font-semibold cursor-pointer mt-2">
          {isReadMore ? 'Voir plus' : 'Réduire'}
        </button>
      )}
    </>
  );
}
