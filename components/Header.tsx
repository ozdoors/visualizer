import { Mail, MapPin, Phone, Search } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { FacebookIcon, LinkedinIcon, TwitterIcon } from "./ui/SocialIcons";
import { Logo } from "./ui/Logo";

export function Header() {
  return (
    <header className="w-full">
      {/* Utility bar (navy) */}
      <div className="bg-[var(--color-navy)] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5 text-xs sm:text-[13px] sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <a href={BRAND.phoneHref} className="flex items-center gap-2 hover:text-[var(--color-accent)]">
              <Phone className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              {BRAND.phone}
            </a>
            <a href={BRAND.emailHref} className="flex items-center gap-2 hover:text-[var(--color-accent)]">
              <Mail className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              {BRAND.email}
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              {BRAND.address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Search className="h-3.5 w-3.5 cursor-pointer hover:text-[var(--color-accent)]" />
            <a href={BRAND.social.twitter} aria-label="Twitter" className="hover:text-[var(--color-accent)]">
              <TwitterIcon className="h-3.5 w-3.5" />
            </a>
            <a href={BRAND.social.linkedin} aria-label="LinkedIn" className="hover:text-[var(--color-accent)]">
              <LinkedinIcon className="h-3.5 w-3.5" />
            </a>
            <a href={BRAND.social.facebook} aria-label="Facebook" className="hover:text-[var(--color-accent)]">
              <FacebookIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main nav bar (white) */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href={BRAND.siteUrl} className="flex shrink-0 items-center">
            <Logo className="h-11 w-auto sm:h-12" />
          </a>

          <nav className="hidden items-center gap-5 xl:flex">
            {BRAND.nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[var(--color-navy)] transition-colors hover:text-[var(--color-accent-strong)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href={`${BRAND.siteUrl}/contact-us/`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-strong)] sm:px-6"
          >
            Request A Quote <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
