import { useCallback, useMemo, useState } from 'react';
import useFabricGroups from '../../../hooks/useFabricGroups';
import { Combobox } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { CheckIcon } from '@heroicons/react/24/solid';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FabricFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';

type Props = {
  className?: string;
  setValue: UseFormSetValue<FabricFormType>;
  watch: UseFormWatch<FabricFormType>;
};

export default function SelectFabricGroupsWidget({
  className,
  setValue,
  watch,
}: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { query: getFabricGroupsQuery, addGroupMutation } = useFabricGroups({
    search: debouncedQuery,
  });
  if (getFabricGroupsQuery.isError) throw getFabricGroupsQuery.error;

  const handleAddGroup = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!e.currentTarget.value || addGroupMutation.isLoading) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        await addGroupMutation.mutateAsync({
          name: e.currentTarget.value,
          fabricIds: [],
        });
      }
    },
    [addGroupMutation]
  );

  const selected = useMemo(() => {
    if (!watch('groupIds')) return [];
    return getFabricGroupsQuery.data?.filter((fabricGroup) =>
      watch('groupIds').includes(fabricGroup._id)
    );
  }, [getFabricGroupsQuery.data, watch('groupIds')]);

  return (
    <div className="relative">
      {addGroupMutation.isLoading && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <Combobox
        multiple
        onChange={(values) => {
          setValue('groupIds', values, { shouldDirty: true });
        }}
        value={watch('groupIds')}
      >
        <Combobox.Input
          className={className}
          onKeyDown={handleAddGroup}
          placeholder="Ajouter un groupe"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <div className="relative">
          <Combobox.Options className="absolute top-full left-0 w-full bg-white rounded-md mt-2 border overflow-hidden shadow-md">
            {getFabricGroupsQuery.data?.map((fabricGroup) => (
              <Combobox.Option
                key={fabricGroup._id}
                value={fabricGroup._id}
                className="p-2 first:border-none border-t flex items-center justify-between"
              >
                {fabricGroup.name}
                <CheckIcon className="ui-selected:visible invisible w-4 h-4 text-primary-100" />
              </Combobox.Option>
            ))}
            {getFabricGroupsQuery.isLoading && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getFabricGroupsQuery.data?.length === 0 && (
              <Combobox.Option value="" disabled className="p-2">
                Aucun groupe trouvée, choisi un nom et utilise la touche
                &quot;Entrée&quot; pour créer un nouveau groupe.
              </Combobox.Option>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
      <small className="min-h-[1.5rem] pl-4 mt-1">
        Selection: {selected?.map((g) => g.name).join(', ') || '-'}
      </small>
    </div>
  );
}
