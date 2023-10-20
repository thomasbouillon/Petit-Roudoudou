import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Group,
  Object3DEventMap,
  Mesh,
  Material,
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

async function loadModel(url: string) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  gltf.scene.rotateX(Math.PI / 2);
  return gltf.scene;
}

export default function use3dModel(url: string) {
  const query = useQuery(['model', url], async () => await loadModel(url), {
    refetchOnWindowFocus: false,
  });

  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const customizedModel = useMemo(() => {
    if (!query.data) return null;
    const clone = query.data;
    traverseModelMeshes(query.data, (mesh) => {
      if (mesh.name && materials[mesh.name]) {
        mesh.material = materials[mesh.name];
      }
    });
    return clone;
  }, [query.data, materials]);

  return {
    query,
    materials,
    modelWithImages: customizedModel,
    setPartImage: (partId: string, imageUrl: string) => {
      setMaterials((prev) => ({ ...prev, [partId]: createMaterial(imageUrl) }));
    },
  };
}

function traverseModelMeshes(
  model: Group<Object3DEventMap>,
  cb: (mesh: Mesh) => void
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model.traverse((child: any) => {
    if (child.isMesh) {
      cb(child);
    }
  });
}

function createMaterial(
  imageUrl: string,
  repeatRatio: [number, number] = [3.5, 1]
) {
  const texture = new TextureLoader().load(imageUrl);

  texture.repeat.set(...repeatRatio);
  texture.wrapS = texture.wrapT = RepeatWrapping;

  const material = new MeshStandardMaterial();
  material.map = texture;
  material.metalness = 0;

  return material;
}
