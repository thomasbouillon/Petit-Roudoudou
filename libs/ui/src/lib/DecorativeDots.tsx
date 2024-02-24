import clsx from 'clsx';
import Image from 'next/image';

export function DecorativeDots(props: { className: string }) {
  return (
    <Image
      src="/images/decorative-dots.png"
      width={194}
      height={230}
      className={clsx('object-contain pointer-events-none scale-75 -rotate-45', props.className)}
      alt="Decorative orange dots"
    />
  );
}

// import { useEffect, useRef } from 'react';

// const CANVAS_WIDTH = 200;
// const CANVAS_HEIGHT = 150;

// const DOT_COUNT = 15;
// const DOT_RADIUS = 5;

// export function DecorativeDots() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const context = canvasRef.current?.getContext('2d');
//     if (!context) return;

//     console.log('Clearing');
//     context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
//     context.fillStyle = 'orange';

//     for (let i = 0; i < DOT_COUNT; i++) {
//       console.log('DRAWING DOT');
//       const x = random_gaussian() * (CANVAS_WIDTH - DOT_RADIUS) + DOT_RADIUS / 2;
//       const y = Math.random() * (CANVAS_HEIGHT - DOT_RADIUS) + DOT_RADIUS / 2;

//       context.beginPath();
//       context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
//       context.fill();
//     }
//   }, [canvasRef.current]);

//   return <canvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasRef} />;
// }

// function random_gaussian() {
//   let x = Math.random();

//   for (let i = 0; i < 6; i += 1) {
//     x += Math.random();
//   }

//   return x / 6;
// }
