import clsx from 'clsx';

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
};

export function QuantityWidget({ value, onChange, max, min }: Props) {
  const disableMinus = min !== undefined && value <= min;
  const disablePlus = max !== undefined && value >= max;
  return (
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        step="1"
        aria-label="Quantité"
        className="w-24 number-controls-hidden rounded-full px-6 py-2 text-center"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value);
          if ((max === undefined || newValue <= max) && (min === undefined || newValue >= min)) {
            onChange(newValue);
          }
        }}
      />
      <button
        type="button"
        className={clsx(
          'mt-[-2px] scale-150 origin-center text-center absolute top-1/2 left-0 -translate-y-1/2 translate-x-2 px-2 focus:outline-none',
          disableMinus && 'opacity-30 cursor-not-allowed pointer-events-none'
        )}
        onClick={() => onChange(value - 1)}
        disabled={disableMinus}
      >
        -
      </button>
      <button
        type="button"
        className={clsx(
          'mt-[-2px] scale-150 origin-center text-center absolute top-1/2 right-0 -translate-y-1/2 -translate-x-2 px-2 focus:outline-none',
          disablePlus && 'opacity-30 cursor-not-allowed pointer-events-none'
        )}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
