import { RefObject, useEffect, useMemo } from 'react';
import {
  Camera,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Object3D,
  Raycaster,
  Vector2,
  Mesh,
  AmbientLight,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function use3DScene(
  threejsContainerRef: RefObject<HTMLElement | null>,
  options?: { onObjectClicked?: (meshName: string) => void }
) {
  const { scene, start, destroy, renderer, camera } = useMemo(
    () => createScene(),
    []
  );

  useEffect(() => {
    if (!threejsContainerRef.current || !renderer.domElement) return;
    const threejsContainer = threejsContainerRef.current;
    threejsContainer.appendChild(renderer.domElement);
    return () => {
      threejsContainer.removeChild(renderer.domElement);
    };
  }, [renderer.domElement, threejsContainerRef]);

  // useEffect(() => {
  //   if (!options?.onObjectClicked) return;

  //   const raycaster = new Raycaster();
  //   const clickHandler = (event: MouseEvent) => {
  //     if (!options?.onObjectClicked) return;
  //     const boundingRect = renderer.domElement.getBoundingClientRect();
  //     const mouse = {
  //       x:
  //         ((event.clientX - boundingRect.x) / renderer.domElement.width) * 2 -
  //         1,
  //       y:
  //         ((event.clientY - boundingRect.top) / renderer.domElement.height) *
  //           2 -
  //         1,
  //     };
  //     raycaster.setFromCamera(mouse as unknown as Vector2, camera);
  //     const intersects = raycaster.intersectObjects(scene.children, true);
  //     intersects.forEach((intersect) => {
  //       if (intersect.object instanceof Mesh)
  //         options?.onObjectClicked?.(intersect.object.name);
  //     });
  //   };
  //   renderer.domElement.addEventListener('click', clickHandler);
  //   return () => {
  //     renderer.domElement.removeEventListener('click', clickHandler);
  //   };
  // }, [
  //   renderer.domElement,
  //   options?.onObjectClicked,
  //   scene.children,
  //   camera,
  //   options,
  // ]);

  useEffect(() => {
    start();
    return () => {
      destroy();
    };
  }, [start, destroy]);

  return {
    start,
    destroy,
    addToScene: (object: Object3D) => {
      scene.add(object);
    },
    removeFromScene: (object: Object3D) => {
      scene.remove(object);
    },
  };
}

const createRenderer = () => {
  const renderer = new WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight * 0.5);
  renderer.setPixelRatio(window.devicePixelRatio);
  return renderer;
};

const createCamera = () => {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / (window.innerHeight * 0.5),
    0.1,
    1000
  );
  camera.position.set(0, 1.1, 0);
  return camera;
};

const createControls = (camera: Camera, domElement: HTMLElement) => {
  const controls = new OrbitControls(camera, domElement);
  controls.enableZoom = false;
  controls.rotateSpeed = 0.4;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.75;
  return controls;
};

const createScene = () => {
  let stoped = false;

  const scene = new Scene();

  const light = new AmbientLight(0xffffff); // soft white light
  scene.add(light);

  const renderer = createRenderer();
  const camera = createCamera();
  scene.add(camera);

  const controls = createControls(camera, renderer.domElement);

  // const axesHelper = new AxesHelper(5);
  // scene.add(axesHelper);

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    if (stoped) return;
    requestAnimationFrame(animate);

    controls.update();
    render();
  }
  animate();

  //   window.addEventListener('resize', onWindowResize, false);
  //   function onWindowResize() {
  //     camera.aspect = window.innerWidth / (window.innerHeight * 0.5);
  //     camera.updateProjectionMatrix();
  //     renderer.setSize(window.innerWidth, window.innerHeight * 0.5);
  //   }

  return {
    scene,
    camera,
    renderer,
    start: () => {
      animate();
    },
    destroy: () => {
      //   window.removeEventListener('resize', onWindowResize);
      stoped = true;
      controls.dispose();
      renderer.dispose();
    },
  };
};
