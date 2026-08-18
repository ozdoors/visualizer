export function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent-strong)]">
        {index}
      </span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
