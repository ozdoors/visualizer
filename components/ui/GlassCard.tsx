import { HTMLAttributes } from "react";
import clsx from "clsx";

export function GlassCard({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "glass-panel rounded-3xl shadow-[0_8px_40px_-12px_rgba(14,16,19,0.15)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SolidCard({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-white rounded-3xl border border-[var(--color-border)] shadow-[0_2px_16px_-8px_rgba(14,16,19,0.12)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
