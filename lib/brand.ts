// Central brand configuration for OZ Aluminium Railing.
// Everything the header/footer need to mirror the main site lives here so
// it's a single place to update if contact details, menu, or the logo change.

export const BRAND = {
  name: "OZ Aluminium Railing",
  tagline: "Elegance in Engineering",
  footerBlurb:
    "Serving Edmonton and surrounding areas with premium glass railing solutions.",

  // The real site logo (hosted on ozaluminiumrailing.ca). Override with
  // NEXT_PUBLIC_LOGO_URL, or drop a file at /public/oz-logo.png and point
  // this at "/oz-logo.png" to self-host it inside the app.
  logoUrl:
    process.env.NEXT_PUBLIC_LOGO_URL ||
    "https://ozaluminiumrailing.ca/wp-content/uploads/2026/01/A_logo_for_OZ_Aluminium_Railing.png",

  phone: "+1 (780) 974-1443",
  phoneHref: "tel:+17809741443",
  email: "Info@ozaluminiumrailing.ca",
  emailHref: "mailto:Info@ozaluminiumrailing.ca",
  address: "5930 96 St NW, Edmonton, AB T6E 3G3, Canada",
  mapEmbedUrl:
    "https://www.google.com/maps?q=5930+96+St+NW+Edmonton+AB+T6E+3G3+Canada&output=embed",

  siteUrl: "https://ozaluminiumrailing.ca",

  nav: [
    { label: "Home", href: "https://ozaluminiumrailing.ca/" },
    { label: "About", href: "https://ozaluminiumrailing.ca/about/" },
    { label: "Railing Types", href: "https://ozaluminiumrailing.ca/railing-types/" },
    { label: "Contact Us", href: "https://ozaluminiumrailing.ca/contact-us/" },
    { label: "Services Areas", href: "https://ozaluminiumrailing.ca/services-areas/" },
    { label: "Gallery", href: "https://ozaluminiumrailing.ca/gallery/" },
    { label: "Blog Posts", href: "https://ozaluminiumrailing.ca/blog/" },
    { label: "FAQs", href: "https://ozaluminiumrailing.ca/faqs/" },
  ],

  social: {
    facebook: "https://www.facebook.com/",
    twitter: "https://twitter.com/",
    linkedin: "https://www.linkedin.com/",
  },
};
