import { useEffect, useState } from 'react';

export default function useBlockBodyScroll() {
  const [isBodyScrollBlocked, setIsBodyScrollBlocked] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (isBodyScrollBlocked) {
      setScrollPosition(document.body.scrollTop);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.scrollTop = scrollPosition;
    }
  }, [isBodyScrollBlocked, scrollPosition]);

  return setIsBodyScrollBlocked;
}
