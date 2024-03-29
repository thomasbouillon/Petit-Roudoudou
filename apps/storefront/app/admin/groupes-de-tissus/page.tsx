'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { Article, FabricGroup, FabricTag } from '@couture-next/types';
import { TrashIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { ButtonWithLoading } from '@couture-next/ui';
import { useMemo } from 'react';

export default function Page() {
  const db = useDatabase();
  const queryCient = useQueryClient();

  const fabricGroupsQuery = useQuery({
    queryKey: ['fabricGroups'],
    queryFn: () =>
      getDocs(collection(db, 'fabricGroups').withConverter(firestoreConverterAddRemoveId<FabricGroup>())).then(
        (snapshot) => snapshot.docs.map((doc) => doc.data())
      ),
  });

  const allArticlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: () =>
      getDocs(collection(db, 'articles').withConverter(firestoreConverterAddRemoveId<Article>())).then((snapshot) =>
        snapshot.docs.map((doc) => doc.data())
      ),
  });

  const fabricTagsQuery = useQuery({
    queryKey: ['fabricTags'],
    queryFn: () =>
      getDocs(collection(db, 'fabricTags').withConverter(firestoreConverterAddRemoveId<FabricTag>())).then((snapshot) =>
        snapshot.docs.map((doc) => doc.data())
      ),
  });

  const removeGroupMutation = useMutation({
    mutationKey: ['fabricGroups', 'remove'],
    mutationFn: (uid: string) =>
      deleteDoc(doc(collection(db, 'fabricGroups'), uid)).then(() =>
        queryCient.invalidateQueries({ queryKey: ['fabricGroups'] })
      ),
  });

  const removeTagMutation = useMutation({
    mutationKey: ['fabricTags', 'remove'],
    mutationFn: (uid: string) =>
      deleteDoc(doc(collection(db, 'fabricTags'), uid)).then(() =>
        queryCient.invalidateQueries({ queryKey: ['fabricTags'] })
      ),
  });

  // used by articles
  const inUseFabricGroups = useMemo(
    () =>
      (
        allArticlesQuery.data
          ?.flatMap((article) => article.customizables.map((customizable) => customizable.fabricListId))
          .filter((group) => group !== undefined) as string[]
      ).reduce((acc, curr) => {
        acc[curr] = true;
        return acc;
      }, {} as Record<string, true>),
    [allArticlesQuery.data]
  );

  if (fabricGroupsQuery.isError) throw fabricGroupsQuery.error;
  if (fabricTagsQuery.isError) throw fabricTagsQuery.error;
  if (removeGroupMutation.isError) throw removeGroupMutation.error;
  if (removeTagMutation.isError) throw removeTagMutation.error;
  if (fabricGroupsQuery.isPending || fabricTagsQuery.isPending) return null;

  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Groupes de tissus</h1>
      <p className="max-w-prose mx-auto mb-8">
        Ici tu retrouveras tous les groupes de tissus ainsi que le nombre de tissus dans chaque groupe. Tu ne peux
        supprimer que les groupes qui sont vides ET qui ne sont pas utilisés dans les articles.
      </p>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {fabricGroupsQuery.data.map((group) => (
          <li className="border-b py-4 flex justify-between" key={group._id}>
            <span className="px-8 block">
              {group.name} ({group.fabricIds.length})
            </span>
            <ButtonWithLoading
              type="button"
              loading={removeGroupMutation.isPending}
              className={clsx(
                'px-2 text-red-500',
                (group.fabricIds.length > 0 || inUseFabricGroups[group._id]) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => removeGroupMutation.mutateAsync(group._id)}
              disabled={group.fabricIds.length > 0}
            >
              <TrashIcon className="w-6 h-6" />
            </ButtonWithLoading>
          </li>
        ))}
        {fabricGroupsQuery.data.length === 0 && (
          <li className="border-b py-4 text-center">Rien à afficher pour le moment</li>
        )}
      </ul>

      <h1 className="text-3xl font-serif text-center mb-8 mt-16">Annotations de tissus</h1>
      <p className="max-w-prose mx-auto mb-8">
        Ici tu retrouveras toutes les propositions d&apos;auto complétion pour les tags de tissus. En supprimer un ne
        supprime seulement que la proposition dans l&apos;adminisatrion et non le tag dans les tissus.
      </p>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {fabricTagsQuery.data.map((tag) => (
          <li className="border-b py-4 flex justify-between" key={tag._id}>
            <span className="px-8 block">{tag.name}</span>
            <ButtonWithLoading
              type="button"
              loading={removeTagMutation.isPending}
              className="px-2 text-red-500"
              onClick={() => removeTagMutation.mutateAsync(tag._id)}
            >
              <TrashIcon className="w-6 h-6" />
            </ButtonWithLoading>
          </li>
        ))}
        {fabricTagsQuery.data.length === 0 && (
          <li className="border-b py-4 text-center">Rien à afficher pour le moment</li>
        )}
      </ul>
    </>
  );
}
