import { Image } from '@prisma/client';
import { Context } from '../../../context';
import { getPublicUrl } from '@couture-next/utils';
import { deleteImageWithResizedVariants } from '../../../utils';

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
