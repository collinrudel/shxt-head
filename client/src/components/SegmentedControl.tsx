interface Option<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex(o => o.value === value);

  return (
    <div className={`relative flex bg-white/10 rounded-full p-1 ${className}`}>
      {/* Sliding thumb */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-yellow-400 transition-all duration-200 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 2px)`,
          left: `calc(${(selectedIndex * 100) / options.length}% + 4px)`,
        }}
      />
      {/* Labels */}
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            opt.value === value ? 'text-black' : 'text-white/70'
          }`}
        >
          <span className="relative">
            {opt.label}
            {opt.badge != null && opt.badge > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
                {opt.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
