import { useCallback, useMemo, useRef, useState } from 'react';
import useFabricGroups from '../../../hooks/useFabricGroups';
import { Combobox } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ArticleFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';
import clsx from 'clsx';
import { useFormContext, useWatch } from 'react-hook-form';
import useArticleGroups from 'apps/storefront/hooks/useArticleGroups';

type Props = {
  className?: string;
};

export default function SelectArticleGroupWidget({ className }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { setValue, control } = useFormContext<ArticleFormType>();
  const groupId = useWatch({ name: 'groupId', control });

  const labelsMemo = useRef<Record<string, string>>({});

  const { query: getArticleGroupsQuery, addGroupMutation } = useArticleGroups({
    search: debouncedQuery,
  });
  if (getArticleGroupsQuery.isError) throw getArticleGroupsQuery.error;

  const handleAddGroup = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        !e.currentTarget.value ||
        addGroupMutation.isPending ||
        getArticleGroupsQuery.data?.find((tag) => tag.name === e.currentTarget.value)
      )
        return;
      if (e.key === 'Enter') {
        e.preventDefault();
        await addGroupMutation.mutateAsync({
          name: e.currentTarget.value,
        });
      }
    },
    [addGroupMutation]
  );

  const selected = useMemo(() => {
    if (!groupId) return undefined;
    if (labelsMemo.current[groupId]) return labelsMemo.current[groupId];
    const label = getArticleGroupsQuery.data?.find((g) => g.id === groupId)?.name;
    if (label) labelsMemo.current[groupId] = label;
    return labelsMemo.current[groupId];
  }, [getArticleGroupsQuery.data, groupId]);

  return (
    <div className="relative">
      {addGroupMutation.isPending && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <Combobox
        onChange={(value) => {
          setValue('groupId', value, { shouldDirty: true });
        }}
        value={groupId}
        as={'div'}
      >
        <div className="relative">
          <Combobox.Input
            className={clsx(className, 'peer')}
            onKeyDown={handleAddGroup}
            placeholder="Ajouter un groupe"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            autoComplete="off"
          />
          <div
            className={clsx(
              className,
              'absolute inset-0 bg-white flex items-center px-2 pointer-events-none peer-focus:hidden ui-open:hidden'
            )}
          >
            {selected}
          </div>
          <small className="absolute bottom-full left-0 hidden ui-open:block peer-focus:block pl-4 mt-1">
            Selection: {selected || '-'}
          </small>
        </div>
        <div className="relative">
          <Combobox.Options className="absolute top-full left-0 w-full z-10 bg-white rounded-md mt-2 border overflow-hidden shadow-md">
            {getArticleGroupsQuery.data?.map((articleGroup) => (
              <Combobox.Option
                key={articleGroup.id}
                value={articleGroup.id}
                className="p-2 first:border-none border-t flex items-center justify-between ui-selected:text-primary-100 ui-not-selected:text-current"
              >
                {articleGroup.name}
              </Combobox.Option>
            ))}
            <Combobox.Option
              value={undefined}
              className="p-2 first:border-none border-t flex items-center justify-between ui-selected:text-primary-100 ui-not-selected:text-current"
            >
              Aucun
            </Combobox.Option>
            {getArticleGroupsQuery.isPending && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getArticleGroupsQuery.data?.length === 0 && (
              <>
                <Combobox.Option value="" disabled className="p-2">
                  Aucun groupe trouvé, choisi un nom et utilise la touche &quot;Entrée&quot; pour créer un nouveau
                  groupe.
                </Combobox.Option>
              </>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
