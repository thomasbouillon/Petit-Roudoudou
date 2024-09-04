import clsx from 'clsx';

export const Field: React.FC<{
  label: string;
  widgetId: string;
  helpText?: string;
  error?: string;
  renderWidget: (className: string) => JSX.Element;
  required?: boolean;
  labelClassName?: string;
}> = ({ label, widgetId, renderWidget, helpText, labelClassName, error, required }) =>
  label ? (
    <>
      <div className={clsx('flex flex-col items-end mt-2', labelClassName)}>
        <label htmlFor={widgetId}>
          {label}
          {required && (
            <span aria-hidden className="text-red-500 font-bold">
              {' '}
              *
            </span>
          )}
        </label>
        {!!helpText && <small className="text-xs text-gray-500 max-w-[min(20rem,45vw)] text-end">{helpText}</small>}
      </div>
      <div>
        {renderWidget('border rounded-md px-4 py-2 w-full bg-white')}
        {!!error && <small className="text-xs text-red-500 mt-1">{error}</small>}
      </div>
    </>
  ) : (
    <div>
      {renderWidget('border rounded-md px-4 py-2 w-full bg-white')}
      {!!error && <small className="text-xs text-red-500 mt-1">{error}</small>}
    </div>
  );
