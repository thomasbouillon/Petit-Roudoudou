import React from 'react';
import { Spinner } from './Spinner';
import clsx from 'clsx';

export const ButtonWithLoading: React.FC<
  { loading: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ loading, children, ...props }) => {
  return (
    <button {...props} className={clsx(props.className, 'relative')}>
      {!loading && children}
      {loading && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="sr-only">Chargement...</span>
            <Spinner className="w-6 h-6 animate-spin" />
          </div>
          {loading && (
            <div className="text-transparent" aria-hidden>
              {children}
            </div>
          )}
        </>
      )}
    </button>
  );
};
