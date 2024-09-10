import React, { useEffect, useMemo } from 'react';
import useFabricsFromGroups from '../../../hooks/useFabricsFromGroups';
import { Article } from '@couture-next/types';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneContext } from './SceneContext';
import TWEEN from '@tweenjs/tween.js';

type Props = {
  article: Article;
  getFabricsByGroupsQuery: ReturnType<typeof useFabricsFromGroups>;
  customizableVariant: Article['customizableVariants'][number];
  customizations?: Record<string, string>;
  canvasRef?: React.Ref<HTMLCanvasElement>;
  enableZoom?: boolean;
};

export default function Article3DScene(
  props: Omit<Props, 'customizableVariant'> & {
    customizableVariant?: Props['customizableVariant'];
  }
) {
  if (!props.customizableVariant) return null;
  return (
    <Canvas resize={{ offsetSize: false, debounce: 1000 }} gl={{ preserveDrawingBuffer: true }} ref={props.canvasRef}>
      <Scene {...props} customizableVariant={props.customizableVariant} />
    </Canvas>
  );
}

function Scene({ article, getFabricsByGroupsQuery, customizableVariant, customizations, enableZoom }: Props) {
  const model = useLoader(GLTFLoader, customizableVariant.threeJsModel.url);

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
          [fabric.id]: textures[i],
        };
      }, {}),
    [flattenedFabrics, textures]
  );

  // Apply textures to model
  useEffect(() => {
    if (!customizations) return;
    Object.entries(customizations).forEach(([customizableId, fabricId]) => {
      const fabric = flattenedFabrics.find((f) => f.id === fabricId);
      if (!fabric) return console.warn('Fabric not found');
      const customizablePart = customizableVariant.customizableParts.find((c) => c.uid === customizableId);
      if (!customizablePart) return console.warn('Customizable part not found');
      const parts = findParts(customizablePart.threeJsModelPartId, model.scene);
      if (parts.length === 0) return console.warn('Part not found (or is not mesh)');
      parts.forEach((part) => setMeshMaterial(part, fabricTextures[fabric.id], customizablePart.size, fabric.size));
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

  const { cameraRef, allowAutoRotate } = useSceneContext();

  const initialPosition = useMemo(() => {
    const position = new THREE.Vector3(customizableVariant.threeJsInitialCameraDistance, 0, 0).applyEuler(
      new THREE.Euler(
        (customizableVariant.threeJsInitialEulerRotation?.x ?? 0) * Math.PI,
        (customizableVariant.threeJsInitialEulerRotation?.y ?? 0) * Math.PI,
        (customizableVariant.threeJsInitialEulerRotation?.z ?? 0.5) * Math.PI
      )
    );
    console.log('initial position: ', position);
    return position;
  }, [customizableVariant.threeJsInitialEulerRotation, customizableVariant.threeJsInitialCameraDistance]);

  // Reset zoom to default when zoom is getting disabled
  useEffect(() => {
    if (!cameraRef?.current) return;
    if (enableZoom === false) {
      cameraRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    }
  }, [enableZoom]);

  return (
    <>
      <OrbitControls
        // minPolarAngle={customizableVariant.threeJsAllAxesRotation ? 0 : Math.PI / 2 - 0.15}
        // maxPolarAngle={customizableVariant.threeJsAllAxesRotation ? Math.PI : Math.PI / 2 + 0.15}
        autoRotate={allowAutoRotate}
        autoRotateSpeed={0.5}
        enableZoom={enableZoom === true && allowAutoRotate}
        enablePan={enableZoom === true && allowAutoRotate}
        enableDamping={allowAutoRotate}
        position0={initialPosition}
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
      {/* <Stats /> */}
      <axesHelper args={[10]} />
      <PerspectiveCamera makeDefault fov={75} far={1000} near={0.1} ref={cameraRef} />
      <Tween />
    </>
  );
}

function Tween() {
  useFrame(() => {
    TWEEN.update(performance.now());
  });
  return null;
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
