type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityWidget({ value, onChange }: Props) {
  return (
    <div className="relative">
      <input
        type="number"
        step="1"
        aria-label="Quantité"
        className="w-20 number-controls-hidden rounded-full px-6 text-center"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <button
        type="button"
        className="text-center absolute top-1/2 left-0 -translate-y-1/2 pl-3 pr-2 focus:outline-none"
        onClick={() => onChange(value - 1)}
      >
        -
      </button>
      <button
        type="button"
        className="text-center absolute top-1/2 right-0 -translate-y-1/2 pl-2 pr-3 focus:outline-none"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
