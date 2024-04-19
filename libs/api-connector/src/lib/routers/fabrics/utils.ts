import { Image } from '@prisma/client';
import { Context } from '../../context';
import { getPlaiceholder } from '../../vendor/plaiceholder';
import { getPublicUrl } from '@couture-next/utils';

export async function createImageFromStorageUid(ctx: Context, imageUid: string) {
  const storage = ctx.storage;
  const newPath = 'fabrics/' + imageUid.substring('uploaded/'.length);
  console.log('moving image', imageUid, 'to', newPath);
  const file = storage.bucket().file(imageUid);
  const exists = await file.exists().then((res) => res[0]);
  console.log('file exists', exists);
  const placeholder = await getPlaiceholder(await file.download().then((res) => res[0])).catch((err) => {
    console.error('Error while generating placeholder', err);
    return null;
  });
  await file.move(newPath);
  const nextImage = {
    uid: newPath,
    url: getPublicUrl(newPath, ctx.environment),
    placeholderDataUrl: placeholder?.base64 ?? null,
  } as Image;

  return nextImage;
}
