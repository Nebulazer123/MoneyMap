type InfoTipProps = {
  label: string;
};

export default function InfoTip({ label }: InfoTipProps) {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 text-xs text-zinc-300 transition hover:border-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-100 shadow-lg whitespace-pre-line group-hover:block group-focus-within:block">
        {label}
      </span>
    </div>
  );
}
