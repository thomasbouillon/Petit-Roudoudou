'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';

type BlockBodyScrollContextValue = {
  blockingRequests: Record<string, boolean>;
  setBlockingRequests: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export const BlockBodyScrollContext = React.createContext<BlockBodyScrollContextValue | undefined>(undefined);

export function BlockBodyScrollContextProvider({ children }: React.PropsWithChildren) {
  const [blockingRequests, setBlockingRequests] = useState({} as Record<string, boolean>);
  const [savedScrollPosition, saveScrollPosition] = useState(0);

  useEffect(() => {
    const isBodyScrollBlocked = Object.values(blockingRequests).some(Boolean);
    if (isBodyScrollBlocked) {
      saveScrollPosition(document.body.scrollTop);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.scrollTop = savedScrollPosition;
    }
  }, [blockingRequests, saveScrollPosition, savedScrollPosition]);

  // Restore when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.scrollTop = savedScrollPosition;
    };
  }, []);

  return (
    <BlockBodyScrollContext.Provider
      value={{
        blockingRequests,
        setBlockingRequests,
      }}
      children={children}
    />
  );
}

export function useBlockBodyScroll(): React.Dispatch<React.SetStateAction<boolean>> {
  const ctx = React.useContext(BlockBodyScrollContext);
  if (!ctx) throw 'useBlockBodyScroll must be used inside a BlockBodyScrollProvider';
  const myId = useMemo(() => uuid(), []);

  useEffect(() => {
    // Release on unmounted
    return () => {
      ctx.setBlockingRequests((prev) => {
        delete prev[myId.toString()];
        return { ...prev };
      });
    };
  }, []);

  return useCallback((b: boolean | ((prev: boolean) => boolean)) => {
    ctx.setBlockingRequests((prev) => ({
      ...prev,
      [myId.toString()]: typeof b === 'function' ? b(prev[myId.toString()] ?? false) : b,
    }));
  }, []);
}
