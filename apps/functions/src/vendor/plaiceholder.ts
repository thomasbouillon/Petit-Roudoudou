import * as sharp from 'sharp';
import { type Sharp } from 'sharp';

// https://github.com/joe-bell/plaiceholder/blob/main/packages/plaiceholder/src/index.ts

type SharpFormatOptions = Parameters<Sharp['toFormat']>;
type SharpModulateOptions = NonNullable<Parameters<Sharp['modulate']>[0]>;

export type GetPlaiceholderSrc = Buffer;

export interface GetPlaiceholderOptions extends SharpModulateOptions {
  autoOrient?: boolean;
  size?: number;
  format?: SharpFormatOptions;
  removeAlpha?: boolean;
}

export const getPlaiceholder = async (
  src: GetPlaiceholderSrc,
  {
    autoOrient = false,
    size = 4,
    format = ['png'],
    brightness = 1,
    saturation = 1.2,
    removeAlpha = false,
    ...options
  }: GetPlaiceholderOptions = {}
) => {
  /* Optimize
    ---------------------------------- */
  const metadata = await sharp(src)
    .metadata()
    .then(({ width, height, ...metadata }) => {
      if (!width || !height) {
        throw Error('Could not get required image metadata');
      }

      return { width, height, ...metadata };
    });

  const sizeMin = 4;
  const sizeMax = 64;

  const isSizeValid = sizeMin <= size && size <= sizeMax;

  !isSizeValid &&
    console.error(
      ['Please enter a `size` value between', sizeMin, 'and', sizeMax].join(' ')
    );

  // initial optimization
  const pipelineStage1 = sharp(src)
    .resize(size, size, {
      fit: 'inside',
    })
    .toFormat(...format)
    .modulate({
      brightness,
      saturation,
      ...(options?.hue ? { hue: options?.hue } : {}),
      ...(options?.lightness ? { lightness: options?.lightness } : {}),
    });

  // alpha
  const pipelineStage2 =
    removeAlpha === false ? pipelineStage1 : pipelineStage1.removeAlpha();

  // autoOrientation
  const pipelineStage3 =
    autoOrient === false ? pipelineStage2 : pipelineStage2.rotate();

  const pipeline = pipelineStage3;

  /* Return
    ---------------------------------- */

  const base64 = await pipeline
    .clone()
    .normalise()
    .toBuffer({ resolveWithObject: true })
    .then(
      ({ data, info }) =>
        `data:image/${info.format};base64,${data.toString('base64')}`
    )
    .catch((err) => {
      console.error('base64 generation failed', err);
      throw err;
    });

  return {
    base64,
    metadata,
  };
};
