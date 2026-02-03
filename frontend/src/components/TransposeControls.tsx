import { getKeyName } from '../utils/transpose';

interface TransposeControlsProps {
  value: number;
  onChange: (value: number) => void;
}

export function TransposeControls({ value, onChange }: TransposeControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">Transpose:</span>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-lg font-bold"
      >
        −
      </button>
      <span className="w-16 text-center font-medium">
        {getKeyName(value)}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded text-lg font-bold"
      >
        +
      </button>
      {value !== 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-sm text-amber-600 hover:text-amber-700"
        >
          Reset
        </button>
      )}
    </div>
  );
}
