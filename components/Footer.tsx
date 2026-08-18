import { Mail, MapPin, Phone } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { FacebookIcon, TwitterIcon } from "./ui/SocialIcons";
import { Logo } from "./ui/Logo";

export function Footer() {
  return (
    <footer className="mt-12 bg-[var(--color-navy)] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <a href={BRAND.siteUrl} className="inline-flex">
            <Logo className="h-11 w-auto rounded bg-white/95 p-1.5" />
          </a>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            {BRAND.footerBlurb}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={BRAND.social.facebook}
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[var(--color-accent)]"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href={BRAND.social.twitter}
              aria-label="Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[var(--color-accent)]"
            >
              <TwitterIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/80">
            {BRAND.nav.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="transition-colors hover:text-[var(--color-accent)]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold">Get In Touch</h3>
          <ul className="mt-5 space-y-4 text-sm text-white/80">
            <li>
              <a href={BRAND.emailHref} className="flex items-start gap-3 hover:text-[var(--color-accent)]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                {BRAND.email}
              </a>
            </li>
            <li>
              <a href={BRAND.phoneHref} className="flex items-start gap-3 hover:text-[var(--color-accent)]">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                {BRAND.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              {BRAND.address}
            </li>
          </ul>
        </div>

        {/* Map */}
        <div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <iframe
              title="OZ Aluminium Railing location"
              src={BRAND.mapEmbedUrl}
              className="h-48 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} {BRAND.name}. Previews are AI-generated
          approximations and not a guarantee of final appearance, fit, or pricing. All
          installations are confirmed on-site prior to fabrication.
        </div>
      </div>
    </footer>
  );
}
