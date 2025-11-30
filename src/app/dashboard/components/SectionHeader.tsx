interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
}

export function SectionHeader({ label, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </div>
      )}
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && (
        <p className="text-sm text-zinc-400">{description}</p>
      )}
    </div>
  );
}
