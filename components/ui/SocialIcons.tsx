// Inline brand SVGs — this version of lucide-react no longer ships social
// brand icons, so we provide small self-contained ones. `className` controls
// size/color (they use currentColor).
import { SVGProps } from "react";

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.87.24-1.46 1.5-1.46H17V3.96c-.28-.04-1.22-.12-2.32-.12-2.3 0-3.88 1.4-3.88 3.98V10H8v3h2.8v8h2.7z" />
    </svg>
  );
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22 5.9c-.7.32-1.5.54-2.3.64.83-.5 1.46-1.28 1.76-2.22-.78.46-1.64.8-2.55.98A4.02 4.02 0 0 0 12 8.87c0 .32.03.63.1.92-3.34-.17-6.3-1.77-8.28-4.2a4 4 0 0 0 1.24 5.36c-.65-.02-1.27-.2-1.8-.5v.05a4.02 4.02 0 0 0 3.22 3.94c-.6.16-1.23.18-1.84.07a4.02 4.02 0 0 0 3.75 2.8A8.07 8.07 0 0 1 2 19.03a11.38 11.38 0 0 0 6.17 1.8c7.4 0 11.45-6.13 11.45-11.45v-.52A8.2 8.2 0 0 0 22 5.9z" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.3 8.5h3.28V21H3.3V8.5zM9.4 8.5h3.14v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.91 2.17 3.91 5V21h-3.27v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.59V21H9.4V8.5z" />
    </svg>
  );
}
