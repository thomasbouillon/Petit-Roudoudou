import { Image } from '@prisma/client';
import { Context } from '../../../context';
import { getPublicUrl } from '@couture-next/utils';

export async function moveImageFromCartToOrder(ctx: Context, orderId: string, image: Image): Promise<Image> {
  const fileRef = ctx.storage.bucket().file(image.uid);
  let newFileName = image.uid.split('/').pop();
  // append .png if no extension (first few carts were missing it)
  if (!newFileName) {
    throw new Error('Invalid image path');
  }
  if (newFileName?.split('.').length === 0) {
    newFileName = `${newFileName}.png`;
  }
  const newPath = `orders/${orderId}/${newFileName}`;
  await fileRef.move(newPath);
  await deleteImageWithResizedVariants(ctx, image.uid);
  return {
    placeholderDataUrl: image.placeholderDataUrl,
    uid: newPath,
    url: getPublicUrl(newPath, ctx.environment),
  };
}

export async function deleteImageWithResizedVariants(ctx: Context, path: string) {
  const size = [64, 128, 256, 512, 1024];
  const resizedExtensions = ['webp', 'png'];

  const splitted = path.split('.');
  const originalExt = splitted.pop();
  path = splitted.join('.');

  const deletePromises = resizedExtensions.flatMap((ext) =>
    size.map((width) => deleteImage(ctx, `${path}_${width}x${width * 2}.${ext}`))
  );

  deletePromises.push(deleteImage(ctx, `${path}.${originalExt}`));

  await Promise.all(deletePromises);
}

async function deleteImage(ctx: Context, path: string) {
  const file = ctx.storage.bucket().file(path);
  if (await file.exists().then((res) => res[0])) await file.delete();
}
