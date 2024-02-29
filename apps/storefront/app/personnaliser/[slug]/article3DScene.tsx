import React, { useEffect, useMemo } from 'react';
import useFabricsFromGroups from '../../../hooks/useFabricsFromGroups';
import { Article } from '@couture-next/types';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import { Spinner } from '@couture-next/ui';

type Props = {
  article: Article;
  getFabricsByGroupsQuery: ReturnType<typeof useFabricsFromGroups>;
  customizations?: Record<string, string>;
  canvasRef?: React.Ref<HTMLCanvasElement>;
  cameraRef?: React.Ref<THREE.PerspectiveCamera>;
  enableZoom?: boolean;
};

function Article3DScene(props: Props) {
  return (
    <Canvas resize={{ offsetSize: false, debounce: 1000 }} gl={{ preserveDrawingBuffer: true }} ref={props.canvasRef}>
      <Scene {...props} />
    </Canvas>
  );
}

export default dynamic(() => Promise.resolve(Article3DScene), {
  ssr: false,
  loading: () => (
    <>
      <p className="text-center pt-4">Chargement de l&apos;aperçu...</p>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Spinner className="w-8 h-8" />
      </div>
    </>
  ),
});

function Scene({ article, getFabricsByGroupsQuery, customizations, cameraRef, enableZoom }: Props) {
  const model = useLoader(GLTFLoader, article.treeJsModel.url);

  // All frabrics regardless of their group
  const flattenedFabrics = useMemo(
    () => Object.values(getFabricsByGroupsQuery.data ?? {}).flat(),
    [getFabricsByGroupsQuery.data]
  );

  // Load all textures
  const textures = useTexture(flattenedFabrics.map((f) => f.image.url));
  const fabricTextures = useMemo(
    () =>
      flattenedFabrics.reduce<Record<string, THREE.Texture>>((acc, fabric, i) => {
        textures[i].wrapS = THREE.RepeatWrapping;
        textures[i].wrapT = THREE.RepeatWrapping;
        textures[i].colorSpace = THREE.SRGBColorSpace;
        textures[i].flipY = false;
        return {
          ...acc,
          [fabric._id]: textures[i],
        };
      }, {}),
    [flattenedFabrics, textures]
  );

  // Apply textures to model
  useEffect(() => {
    if (!customizations) return;
    Object.entries(customizations).forEach(([customizableId, fabricId]) => {
      const fabric = flattenedFabrics.find((f) => f._id === fabricId);
      if (!fabric) return console.warn('Fabric not found');
      const customizablePart = article.customizables.find((c) => c.uid === customizableId);
      if (!customizablePart) return console.warn('Customizable part not found');
      if (customizablePart.type !== 'customizable-part') return console.warn('Invalid customizable');
      const parts = findParts(customizablePart.treeJsModelPartId, model.scene);
      if (parts.length === 0) return console.warn('Part not found (or is not mesh)');
      parts.forEach((part) => setMeshMaterial(part, fabricTextures[fabric._id], customizablePart.size, fabric.size));
    });
  }, [Object.values(customizations ?? {}), flattenedFabrics, fabricTextures, model.scene, article.customizables]);

  // Reset material on unmount
  useEffect(() => {
    return () => {
      const basicMaterial = new THREE.MeshStandardMaterial();
      model.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          if (o.material) o.material = basicMaterial;
        }
      });
    };
  }, []);

  // Reset zoom to default when zoom is getting disabled
  useEffect(() => {
    if (typeof cameraRef !== 'object' || !cameraRef?.current) return;
    if (enableZoom === false) {
      cameraRef.current.position.set(0, article.treeJsInitialCameraDistance, 0);
    }
  }, [enableZoom, cameraRef]);

  return (
    <>
      <OrbitControls
        minPolarAngle={Math.PI / 2 - 0.15}
        maxPolarAngle={Math.PI / 2 + 0.15}
        autoRotate={true}
        autoRotateSpeed={0.75}
        enableZoom={enableZoom === true}
        enablePan={false}
      />
      <primitive object={model.scene} />
      <directionalLight position={[0, 0, 10]} intensity={1.5} />
      <directionalLight position={[0, 8.66, 5]} intensity={1.5} />
      <directionalLight position={[8.66, 5, 0]} intensity={1.5} />
      <directionalLight position={[0, 8.66, -5]} intensity={1.5} />
      <directionalLight position={[0, 0, -10]} intensity={1.5} />
      <directionalLight position={[0, -8.66, -5]} intensity={1.5} />
      <directionalLight position={[-8.66, 5, 0]} intensity={1.5} />
      <directionalLight position={[0, 8.66, 5]} intensity={1.5} />
      <PerspectiveCamera
        makeDefault
        position={[0, article.treeJsInitialCameraDistance, 0]}
        fov={75}
        far={1000}
        near={0.1}
        ref={cameraRef}
      />
    </>
  );
}

function setMeshMaterial(
  mesh: THREE.Mesh,
  texture: THREE.Texture,
  meshRealSize: [number, number],
  textureRealSize: [number, number]
) {
  // clear previous material
  if (mesh.material && !Array.isArray(mesh.material)) mesh.material.dispose();

  // prepare material texture
  const clonedTexture = texture.clone();
  clonedTexture.repeat.set(meshRealSize[0] / textureRealSize[0], meshRealSize[1] / textureRealSize[1]);

  // set material
  const material = new THREE.MeshStandardMaterial();
  material.side = THREE.FrontSide;
  material.map = clonedTexture;
  mesh.material = material;
}

function findParts(name: string, scene: THREE.Object3D) {
  if (!name) return [];
  const parts: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      if (o.name.startsWith(name)) parts.push(o);
    }
  });
  return parts;
}
