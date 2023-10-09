import clsx from 'clsx';

export const Field: React.FC<{
  label: string;
  widgetId: string;
  helpText?: string;
  error?: string;
  renderWidget: (className: string) => JSX.Element;
  labelClassName?: string;
}> = ({ label, widgetId, renderWidget, helpText, labelClassName, error }) =>
  label ? (
    <>
      <div className={clsx('flex flex-col items-end mt-2', labelClassName)}>
        <label htmlFor={widgetId}>{label}</label>
        {!!helpText && (
          <small className="text-xs text-gray-500">{helpText}</small>
        )}
      </div>
      <div>
        {renderWidget('border rounded-md px-4 py-2 w-full')}
        {!!error && (
          <small className="text-xs text-red-500 mt-1">{error}</small>
        )}
      </div>
    </>
  ) : (
    <div>
      {renderWidget('border rounded-md px-4 py-2 w-full')}
      {!!error && <small className="text-xs text-red-500 mt-1">{error}</small>}
    </div>
  );
