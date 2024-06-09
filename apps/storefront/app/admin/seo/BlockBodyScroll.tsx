'use client';

import { useBlockBodyScroll } from 'apps/storefront/contexts/BlockBodyScrollContext';
import useIsMobile from 'apps/storefront/hooks/useIsMobile';
import { useEffect } from 'react';

export default function BlockBodyScroll() {
  const blockBodyScroll = useBlockBodyScroll();
  const isMobile = useIsMobile();

  useEffect(() => {
    blockBodyScroll(!isMobile);
  }, [isMobile]);

  return null;
}
