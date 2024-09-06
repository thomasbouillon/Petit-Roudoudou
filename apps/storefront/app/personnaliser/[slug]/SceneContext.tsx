import { createContext, PropsWithChildren, RefObject, useContext, useRef, useState } from 'react';

type SceneContextValue = {
  cameraRef: RefObject<THREE.PerspectiveCamera>;
  allowAutoRotate: boolean;
  setAllowAutoRotate: (value: boolean) => void;
};

const SceneContext = createContext<SceneContextValue | null>(null);

export const SceneContextProvider = ({
  children,
  cameraRef,
}: PropsWithChildren<{
  cameraRef?: RefObject<THREE.PerspectiveCamera>;
}>) => {
  const [allowAutoRotate, setAllowAutoRotate] = useState(true);

  return (
    <SceneContext.Provider
      value={{
        cameraRef: cameraRef ?? useRef<THREE.PerspectiveCamera>(null),
        allowAutoRotate,
        setAllowAutoRotate,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
};

export function useSceneContext() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useSceneContext must be used within a SceneProvider');
  }
  return context;
}
