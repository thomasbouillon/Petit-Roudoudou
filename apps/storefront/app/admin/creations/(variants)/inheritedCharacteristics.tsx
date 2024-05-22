import { Field } from '@couture-next/ui';
import { Controller, useWatch } from 'react-hook-form';
import { ArticleFormType } from '../form';
import clsx from 'clsx';
import { Listbox } from '@headlessui/react';

type Props = {
  customizableVariantIndex: number;
};

export default function InheritedCharacteristics({ customizableVariantIndex }: Props) {
  const customizables = useWatch<ArticleFormType, 'customizables'>({
    name: 'customizables',
  });

  return (
    <Field
      label="Options"
      widgetId={`customizableVariants.${customizableVariantIndex}.inherits`}
      helpText="CTRL+click pour sélectionner plusieurs options"
      renderWidget={(className) =>
        customizables.length === 0 ? (
          <small className={clsx(className, 'block h-full')}>Commence par les définir dans l'onglet 'Options'</small>
        ) : (
          <Controller
            name={`customizableVariants.${customizableVariantIndex}.inherits`}
            render={({ field }) => (
              <Listbox
                multiple
                value={field.value ?? []}
                onChange={(v) => {
                  console.log('value', v);
                  field.onChange(v);
                }}
              >
                <Listbox.Options static as="ul" className={className}>
                  {customizables.map((customizable, i) => (
                    <Listbox.Option
                      key={i}
                      value={customizable.uid}
                      className="ui-not-selected:line-through ui-selected:no-underline !outline-none"
                    >
                      {customizable.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            )}
          />
        )
      }
    />
  );
}
