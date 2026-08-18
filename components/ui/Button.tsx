import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-deep)] shadow-[0_6px_20px_-6px_rgba(30,27,69,0.45)]",
        variant === "accent" &&
          "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] shadow-[0_8px_24px_-6px_rgba(176,137,79,0.5)]",
        variant === "secondary" &&
          "bg-white text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
        variant === "ghost" && "text-[var(--color-ink-soft)] hover:bg-black/5",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
