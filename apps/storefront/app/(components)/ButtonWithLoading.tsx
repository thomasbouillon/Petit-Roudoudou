import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';
import clsx from 'clsx';

type Props = { loading: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonWithLoading = forwardRef<HTMLButtonElement, Props>(({ loading, children, ...props }, ref) => {
  return (
    <button {...props} className={clsx(props.className, 'relative')} ref={ref}>
      {!loading && children}
      {loading && (
        <>
          <div className="absolute left-0 top-0 right-0 bottom-0 flex items-center justify-center">
            <span className="sr-only">Chargement...</span>
            <Spinner className="w-6 h-6" />
          </div>
          {loading && (
            <div className="text-transparent !no-underline" aria-hidden>
              {children}
            </div>
          )}
        </>
      )}
    </button>
  );
});
