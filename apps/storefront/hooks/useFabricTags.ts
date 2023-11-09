import type { FabricTag, NewFabricTag } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import slugify from 'slugify';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';

type Return = {
  query: UseQueryResult<FabricTag[]>;
  addTagMutation: UseMutationResult<FabricTag, unknown, NewFabricTag>;
};

type Props = {
  search?: string;
};

export default function useFabricTags(props?: Props): Return {
  const database = useDatabase();

  const getFabricTagsQuery = useQuery(
    ['fabricTags.find.namePermutations', props?.search],
    async () => {
      const firestoreQuery = !props?.search
        ? collection(database, 'fabricTags')
        : query(
            collection(database, 'fabricTags'),
            where(
              'namePermutations',
              'array-contains',
              slugify(props.search, { lower: true })
            )
          );

      const snapshot = await getDocs(
        firestoreQuery.withConverter(firestoreConverterAddRemoveId<FabricTag>())
      );
      return snapshot.docs.map((doc) => doc.data());
    },
    { keepPreviousData: true }
  );

  const addTagMutation = useMutation(['addTag'], async (tag) => {
    const docRef = await addDoc(collection(database, 'fabricTags'), {
      ...tag,
      namePermutations: getNamePermutations(tag.name),
    });
    getFabricTagsQuery.refetch();
    return {
      _id: docRef.id,
      ...tag,
    };
  }) satisfies Return['addTagMutation'];

  return {
    query: getFabricTagsQuery,
    addTagMutation,
  };
}

const getNamePermutations = (name: string) => {
  name = slugify(name, { lower: true });
  const r = [];
  for (let i = 0; i < name.length; i++) {
    for (let j = i + 1; j <= name.length; j++) {
      r.push(name.slice(i, j));
    }
  }
  return r;
};
