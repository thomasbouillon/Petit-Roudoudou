import { useCallback, useMemo, useRef, useState } from 'react';
import useFabricGroups from '../../../hooks/useFabricGroups';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { CheckIcon } from '@heroicons/react/24/solid';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FabricFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';
import clsx from 'clsx';

type Props = {
  className?: string;
  setValue: UseFormSetValue<FabricFormType>;
  watch: UseFormWatch<FabricFormType>;
};

export default function SelectFabricGroupsWidget({ className, setValue, watch }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const labelsMemory = useRef({} as Record<string, string>);

  const { query: getFabricGroupsQuery, addGroupMutation } = useFabricGroups({
    search: debouncedQuery,
  });
  if (getFabricGroupsQuery.isError) throw getFabricGroupsQuery.error;

  const handleAddGroup = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        !e.currentTarget.value ||
        addGroupMutation.isPending ||
        getFabricGroupsQuery.data?.find((tag) => tag.name === e.currentTarget.value)
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
    if (!watch('groupIds')) return [];
    return watch('groupIds').map((id) => {
      if (!labelsMemory.current[id]) {
        const group = getFabricGroupsQuery.data?.find((g) => g.id === id);
        if (group) labelsMemory.current[id] = group.name;
      }
      return labelsMemory.current[id];
    });
  }, [getFabricGroupsQuery.data, watch('groupIds')]);

  return (
    <div className="relative">
      {addGroupMutation.isPending && (
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
        as={'div'}
        className="group"
      >
        <div className="relative">
          <ComboboxInput
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
              'absolute inset-0 bg-white flex items-center px-2 pointer-events-none peer-focus:hidden group-data-[open]:hidden'
            )}
          >
            {selected.join(', ')}
          </div>
          <small className="absolute bottom-full left-0 hidden group-data-[open]:block peer-focus:block pl-4 mt-1">
            Selection: {selected.join(', ') || '-'}
          </small>
        </div>

        <div className="relative">
          <ComboboxOptions
            modal={false}
            as="ul"
            className="absolute top-full left-0 w-full z-10 bg-white rounded-md mt-2 border overflow-hidden shadow-md"
          >
            {getFabricGroupsQuery.data?.map((fabricGroup) => (
              <ComboboxOption
                as="li"
                key={fabricGroup.id}
                value={fabricGroup.id}
                className="p-2 first:border-none border-t flex items-center justify-between data-[selected]:text-primary-100 group"
              >
                {fabricGroup.name}
                <CheckIcon className="group-data-[selected]:visible invisible w-4 h-4" />
              </ComboboxOption>
            ))}
            {getFabricGroupsQuery.isPending && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getFabricGroupsQuery.data?.length === 0 && (
              <ComboboxOption as="li" value="" disabled className="p-2">
                Aucun groupe trouvé, choisi un nom et utilise la touche &quot;Entrée&quot; pour créer un nouveau groupe.
              </ComboboxOption>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
