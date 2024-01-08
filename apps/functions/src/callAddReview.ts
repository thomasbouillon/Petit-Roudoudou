import { Article, CallAddReviewPayload, CallAddReviewResponse, Order, Review } from '@couture-next/types';
import { adminFirestoreConverterAddRemoveId, adminFirestoreOrderConverter } from '@couture-next/utils';
import { DocumentSnapshot, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

export const callAddReview = onCall<unknown, Promise<CallAddReviewResponse>>({ cors: '*' }, async (event) => {
  const authorId = event.auth?.uid;
  if (!authorId) throw new Error('Not authenticated');

  const payload = reviewSchema.parse(event.data);

  const firestore = getFirestore();
  const articleSnapshot = await firestore
    .collection('articles')
    .withConverter(adminFirestoreConverterAddRemoveId<Article>())
    .doc(payload.articleId)
    .get();

  if (!articleSnapshot.exists) throw new Error('Article not found');

  const review = {
    articleId: payload.articleId,
    authorId,
    score: payload.score,
    text: payload.text,
    createdAt: new Date().getTime() as never,
  } satisfies Omit<Review, '_id'>;

  const reviewRef = firestore.collection('reviews').doc();
  const orderRef = firestore.collection('orders').withConverter(adminFirestoreOrderConverter).doc(payload.orderId);

  const getAndCheckOrder = (orderSnapshot: DocumentSnapshot<Order>) => {
    // Exists ?
    if (!orderSnapshot.exists) throw new Error('Order not found');

    // Check author and order status
    const order = orderSnapshot.data()!;
    if (order.user.uid !== authorId || order.status !== 'paid') throw new Error('Not authorized');

    // Check article is in order
    const linkedItem = order.items.find((item) => item.articleId === payload.articleId);
    if (!linkedItem) throw new Error('Article not in order');
    if (linkedItem.reviewId) throw new Error('Article already reviewed');
    return order;
  };

  await firestore.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    const order = getAndCheckOrder(orderSnapshot);

    const updatedOrderItems = order.items.map((item) =>
      item.articleId === payload.articleId ? { ...item, reviewId: reviewRef.id } : item
    );

    transaction.create(reviewRef, review);
    transaction.set(orderSnapshot.ref, { items: updatedOrderItems }, { merge: true });
    transaction.set(articleSnapshot.ref, { reviewIds: FieldValue.arrayUnion(reviewRef.id) }, { merge: true });
  });
});

const reviewSchema = z.object({
  score: z.number().int().min(1).max(5),
  text: z.string().min(5),
  articleId: z.string(),
  orderId: z.string(),
}) satisfies z.ZodType<CallAddReviewPayload>;
