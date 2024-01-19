import clsx from 'clsx';

type Props = {
  value: number;
  onChange: (value: number) => void;
  disableMinus?: boolean;
  disablePlus?: boolean;
};

export function QuantityWidget({ value, onChange, disableMinus, disablePlus }: Props) {
  return (
    <div className="relative">
      <input
        type="number"
        step="1"
        aria-label="Quantité"
        className="w-24 number-controls-hidden rounded-full px-6 py-2 text-center"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <button
        type="button"
        className={clsx(
          'mt-[-2px] scale-150 origin-center text-center absolute top-1/2 left-0 -translate-y-1/2 pl-3 pr-1 focus:outline-none',
          disableMinus && 'opacity-30 cursor-not-allowed'
        )}
        onClick={() => onChange(value - 1)}
        disabled={disableMinus}
      >
        -
      </button>
      <button
        type="button"
        className={clsx(
          'mt-[-2px] scale-150 origin-center text-center absolute top-1/2 right-0 -translate-y-1/2 pl-1 pr-3 focus:outline-none',
          disablePlus && 'opacity-30 cursor-not-allowed'
        )}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
