import { readFile } from 'fs/promises';
import { getFirestore } from './firebase';
import { Review } from '@couture-next/types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Create reviews from csv file and seed them into the database.
 * @param pathToCsv Path to the csv file containing the reviews.
 * @param articleIdMapping First element is the id of the first article in the csv, and so on.
 */
export async function seedReviews(pathToCsv: string, ...articleIdMapping: string[]) {
  const reviews = await getReviews(pathToCsv);

  if (articleIdMapping.length !== 11)
    throw 'Invalid article id mapping, required 11 ids, got ' + articleIdMapping.length;

  const firestore = getFirestore();
  await Promise.all([
    reviews.map(async (review) => {
      await Promise.all(
        review.articleReviews.map(async (reviewStr, i) => {
          const [day, month, year] = review.dateStr.split('/');
          if (reviewStr === '') return;
          const newReview = {
            articleId: articleIdMapping[i],
            authorName: review.authorName,
            createdAt: new Date(`${year}-${month}-${day}T00:00:00Z`).getTime() as any,
            score: parseInt(review.scoreStr),
            authorId: 'legacy',
            text: reviewStr,
          } satisfies Omit<Review, '_id'>;

          const snap = await firestore.collection('reviews').add(newReview);
          const articleRef = firestore.collection('articles').doc(articleIdMapping[i]);
          return await articleRef.update({ reviewIds: FieldValue.arrayUnion(snap.id) });
        })
      );
    }),
  ]);

  console.log('Reviews seeded, count of reviews:' + (await firestore.collection('reviews').count().get()).data().count);
}

async function getReviews(pathToCsv: string) {
  const reviewsCsv = await readFile(pathToCsv);
  const reviews = reviewsCsv
    .toString()
    .split('\n')
    .map((line: string, i) => {
      const [authorName, dateStr, scoreStr, ...articleReviews] = line.split(';');
      if (articleReviews.length !== 11) throw 'Invalid csv format at line ' + i;
      return { authorName, dateStr, scoreStr, articleReviews };
    })
    .slice(1);
  return reviews;
}
