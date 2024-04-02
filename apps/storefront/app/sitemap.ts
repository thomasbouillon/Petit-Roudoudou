import { routes } from '@couture-next/routing';
import { MetadataRoute } from 'next';
import env from '../env';
import { collection, doc, getDoc } from 'firebase/firestore';
import useDatabase from '../hooks/useDatabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = useDatabase();

  const [homeUpdatedAt, eventsUpdatedAt, partnersUpdatedAt, faqUpdatedAt] = await Promise.all([
    getDoc(doc(collection(db, 'cms-metadata'), 'home')).then((snap) =>
      snap.exists() ? new Date(snap.data()!.updatedAt).toISOString() : undefined
    ),
    getDoc(doc(collection(db, 'cms-metadata'), 'events')).then((snap) =>
      snap.exists() ? new Date(snap.data()!.updatedAt).toISOString() : undefined
    ),
    getDoc(doc(collection(db, 'cms-metadata'), 'partners')).then((snap) =>
      snap.exists() ? new Date(snap.data()!.updatedAt).toISOString() : undefined
    ),
    getDoc(doc(collection(db, 'cms-metadata'), 'faq')).then((snap) =>
      snap.exists() ? new Date(snap.data()!.updatedAt).toISOString() : undefined
    ),
  ]);

  return [
    ...[
      { url: routes().index(), lastModified: homeUpdatedAt, priority: 0.8 },
      { url: routes().events().index(), lastModified: eventsUpdatedAt },
      { url: routes().partners().index(), lastModified: partnersUpdatedAt },
      { url: routes().faq().index(), lastModified: faqUpdatedAt },
    ],
    ...[routes().contactUs(), routes().auth().login(), routes().auth().register(), routes().fabrics().index()].map(
      (url) => ({ url: env.BASE_URL + url })
    ),
  ];
}
