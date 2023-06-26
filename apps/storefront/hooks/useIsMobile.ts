import { useEffect, useState } from 'react';

export default function useIsMobile(defaultForSsr = false) {
  const [windowWidth, setWindowWidth] = useState(
    typeof window === 'undefined' ? null : window.innerWidth
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (typeof window === 'undefined') return setWindowWidth(null);
      if (window.innerWidth === windowWidth) return;
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth === null ? defaultForSsr : windowWidth < 640;
}
