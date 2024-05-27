import { useCallback, useMemo, useRef, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Spinner } from '@couture-next/ui';
import { ArticleFormType } from './form';
import { useDebounce } from '../../../hooks/useDebounce';
import clsx from 'clsx';
import { useFormContext, useWatch } from 'react-hook-form';
import useArticleThemes from 'apps/storefront/hooks/useArticleThemes';

type Props = {
  className?: string;
};

export default function SelectArticleThemeWidget({ className }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { setValue, control } = useFormContext<ArticleFormType>();
  const themeId = useWatch({ name: 'themeId', control });

  const labelsMemo = useRef<Record<string, string>>({});

  const { query: getArticleThemesQuery, addThemeMutation } = useArticleThemes({
    search: debouncedQuery,
  });
  if (getArticleThemesQuery.isError) throw getArticleThemesQuery.error;

  const handleAddTheme = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        !e.currentTarget.value ||
        addThemeMutation.isPending ||
        getArticleThemesQuery.data?.find((tag) => tag.name === e.currentTarget.value)
      )
        return;
      if (e.key === 'Enter') {
        e.preventDefault();
        await addThemeMutation.mutateAsync({
          name: e.currentTarget.value,
        });
      }
    },
    [addThemeMutation]
  );

  const selected = useMemo(() => {
    if (!themeId) return undefined;
    if (labelsMemo.current[themeId]) return labelsMemo.current[themeId];
    const label = getArticleThemesQuery.data?.find((g) => g.id === themeId)?.name;
    if (label) labelsMemo.current[themeId] = label;
    return labelsMemo.current[themeId];
  }, [getArticleThemesQuery.data, themeId]);

  return (
    <div className="relative">
      {addThemeMutation.isPending && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <Combobox
        onChange={(value) => {
          setValue('themeId', value, { shouldDirty: true });
        }}
        value={themeId}
        as={'div'}
      >
        <div className="relative">
          <Combobox.Input
            className={clsx(className, 'peer')}
            onKeyDown={handleAddTheme}
            placeholder="Ajouter un themee"
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
            {getArticleThemesQuery.data?.map((articleTheme) => (
              <Combobox.Option
                key={articleTheme.id}
                value={articleTheme.id}
                className="p-2 first:border-none border-t flex items-center justify-between ui-selected:text-primary-100 ui-not-selected:text-current"
              >
                {articleTheme.name}
              </Combobox.Option>
            ))}
            <Combobox.Option
              value={undefined}
              className="p-2 first:border-none border-t flex items-center justify-between ui-selected:text-primary-100 ui-not-selected:text-current"
            >
              Aucun
            </Combobox.Option>
            {getArticleThemesQuery.isPending && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            {getArticleThemesQuery.data?.length === 0 && (
              <>
                <Combobox.Option value="" disabled className="p-2">
                  Aucun themee trouvé, choisi un nom et utilise la touche &quot;Entrée&quot; pour créer un nouveau
                  themee.
                </Combobox.Option>
              </>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
