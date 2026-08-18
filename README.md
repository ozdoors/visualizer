# OZ Aluminium Railing — AI Railing Visualizer

An AI-powered "before/after" railing visualizer built with Next.js, React, Tailwind CSS,
and Google's `gemini-3.1-flash-image` model (with OpenAI as a drop-in alternative).
Homeowners, builders, and contractors
upload a photo of their deck, porch, balcony, or staircase, choose a railing system and
options, and get a photorealistic AI-generated preview with a before/after slider — plus
an internal-only measurement estimate and quote request emailed straight to your team.

This README is written for whoever sets this up and deploys it — you don't need to be a
developer to follow it, but a developer will make it faster.

---

## 1. What's inside

```
app/
  page.tsx                 The visualizer page (the whole customer-facing wizard)
  layout.tsx                Global layout + metadata
  api/
    config/                 Tells the frontend which storage backend is active
    blob-upload/             Vercel Blob client-upload token endpoint (Step 1)
    upload-local/             Local-storage fallback upload endpoint (dev/self-host)
    files/[key]/               Serves locally-stored files (dev/self-host only)
    visualize/                 Step 4/5 — scene analysis + AI railing edit
    measurements/                Step 6 — internal-only AI measurement estimate
    request-quote/                 Step 7/8 — emails the quote request to your team
components/                The wizard UI (upload, system picker, options, before/after
                            slider, quote form) — modern/minimal, glassmorphism, mobile
                            responsive
lib/
  products.ts               Railing systems, colors, glass types, finishes — EDIT THIS
                             to change what customers can choose from, and to point at
                             real product photos once you have them
  prompts.ts                 The AI prompt engineering + guardrails (Step 4/5/6 rules)
  ai.ts                        Provider switch — picks Gemini or OpenAI by env var
  gemini.ts                      Google Gemini calls (scene analysis, image edit, measurements)
  openai.ts                      OpenAI calls (same three functions, alternative provider)
  email.ts                       Resend email template for the internal quote email
  storage.ts                       Vercel Blob / local storage abstraction
public/
  swatches/, products/      Placeholder images — replace with real photos any time
  embed-resize.js            Script for the WordPress page that auto-resizes the iframe
```

## 2. How it maps to the spec

| Step | Where it lives |
|---|---|
| 1. Upload (JPG/PNG/HEIC/WEBP, 20MB) | `components/UploadStep.tsx`, `lib/uploadClient.ts` |
| 2. Select railing system | `components/SystemStep.tsx`, `lib/products.ts` |
| 3. Select color/glass/finish | `components/OptionsStep.tsx`, `lib/products.ts` |
| 4. AI detection of edges/geometry + guardrails | `lib/prompts.ts` (`SCENE_ANALYSIS_*`), `app/api/visualize/route.ts` |
| 5. Generate photorealistic image | `lib/gemini.ts` / `lib/openai.ts` (`generateRailingEdit`) via `lib/ai.ts`, `lib/prompts.ts` (`buildEditPrompt`) |
| 5. Before/after slider | `components/CompareSlider.tsx` |
| 6. Measurement estimate (internal only) | `lib/gemini.ts` / `lib/openai.ts` (`estimateMeasurements`) via `lib/ai.ts`, never rendered in the UI |
| 7. Quotation summary (internal only) | `lib/email.ts`, sent as an email — never shown to the customer |
| 8. Send everything to your team | `app/api/request-quote/route.ts` → Resend email |

**Important by design:** the measurement estimate and quotation summary are **never**
sent to the browser for display — they only ever leave the server inside the email to
`COMPANY_EMAIL`. The customer only ever sees the before/after preview and a generic
"we'll be in touch" confirmation.

## 3. Local setup

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env.local
# fill in .env.local — see section 4 below
npm run dev
```

Open http://localhost:3000. Without any keys configured, the app will run but the
"Generate my preview" and "Request Final Quote" steps will fail until you add a Gemini
key (and a Resend key for email). Uploads will work locally without any storage keys
configured (see "Storage" below).

## 4. Getting your API keys

### Google Gemini (default — powers Steps 4, 5, and 6)

The app uses Gemini by default (`AI_PROVIDER=gemini`) — it's cheaper (~$0.039/image)
and especially strong at preserving the original photo while editing in the railing.

1. Go to https://aistudio.google.com and sign in (use a business Google account for
   OZ Aluminium Railing so billing/ownership is clean).
2. Click **Get API key → Create API key**, let it create a Google Cloud project if
   asked, and copy the key into `.env.local` / your host as `GEMINI_API_KEY`.
3. Enable the paid tier / billing on that project (AI Studio → Get API key → your
   project → Set up billing) so it works for public traffic beyond the free tier.
   Optionally set a budget alert in Google Cloud → Billing → Budgets.

Two models are used (both configurable):
- `GEMINI_IMAGE_MODEL` (default `gemini-3.1-flash-image`, "nano banana") — the edit.
- `GEMINI_VISION_MODEL` (default `gemini-3.5-flash`) — reads the photo to detect
  edges/geometry and to estimate measurements.

### OpenAI (alternative — set `AI_PROVIDER=openai`)

To use OpenAI instead, set `AI_PROVIDER=openai` and add `OPENAI_API_KEY` (from
https://platform.openai.com → Billing + API keys). Models: `OPENAI_IMAGE_MODEL`
(default `gpt-image-1.5`; `gpt-image-1-mini` is cheaper), `OPENAI_VISION_MODEL`
(default `gpt-4o`), and `OPENAI_IMAGE_QUALITY` (`low`/`medium`/`high`/`auto`). No code
changes — the provider is chosen entirely by env vars (see `lib/ai.ts`).

### Resend (required — powers Step 7/8 email delivery)

1. Go to https://resend.com and create an account.
2. Under **Domains**, add `ozaluminiumrailing.ca` (or a subdomain like
   `mail.ozaluminiumrailing.ca`) and add the DNS records it gives you (SPF/DKIM) at
   your domain registrar. This is required — Resend won't send from an unverified
   domain, and unverified sending damages your deliverability.
3. Once verified, create an API key under **API Keys** and set it as `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on that verified domain, e.g.
   `visualizer@ozaluminiumrailing.ca`.
5. Set `COMPANY_EMAIL` to where quote requests should land — defaults to
   `info@ozaluminiumrailing.ca`. You can also point this at a shared inbox or a
   distribution list.

### Storage — Vercel Blob (recommended for production)

Photos (originals up to 20MB, plus the AI-generated results) need somewhere to live.
The app is built to run on Vercel, whose serverless functions cap request bodies at
4.5MB — too small for a 20MB photo upload. To handle this correctly, original photo
uploads go **directly from the browser to Vercel Blob** (bypassing that limit
entirely), and the AI-generated result is stored the same way from the server.

1. In your Vercel project, go to **Storage → Create Database → Blob**.
2. Create a store (Public access is fine — generated preview/quote images aren't
   sensitive, but see the privacy note in section 7).
3. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project's environment
   variables. Locally, run `vercel env pull` to get it into `.env.local`, or leave it
   blank locally — the app automatically falls back to storing files in a local
   `.data/uploads` folder for development.

If you deploy somewhere other than Vercel (a VPS, Docker, etc.) without Vercel's body
size limit, you can leave `BLOB_READ_WRITE_TOKEN` unset and the app will use the local
storage driver in production too — just make sure `.data/uploads` is on a persistent
disk, not an ephemeral container filesystem, and that `NEXT_PUBLIC_SITE_URL` is set to
your real public URL (OpenAI needs to be able to fetch the stored image over the
internet). For anything beyond light traffic on non-Vercel hosting, swap in S3 or
another object store instead — `lib/storage.ts` is a small, single-file abstraction
that's easy to extend.

## 5. Deploying to Vercel

1. Push this project to a GitHub/GitLab repo.
2. In Vercel, **Add New → Project**, import the repo.
3. Add the environment variables from `.env.example` under **Settings → Environment
   Variables** (Production and Preview).
4. Deploy. You'll get a URL like `railing-visualizer.vercel.app` — this is the app the
   WordPress page will embed (see section 6). You can also add a custom subdomain
   (e.g. `app.ozaluminiumrailing.ca`) under **Settings → Domains** if you'd rather not
   show a `vercel.app` URL anywhere.

## 6. Embedding on ozaluminiumrailing.ca/visualizer (WordPress)

The visualizer is a separate Next.js/Node application — WordPress can't run it
natively — so it's embedded into a WordPress page via an iframe. This keeps the
WordPress site simple while giving you the full React/Node app underneath.

1. In WordPress, create a new Page with the slug `visualizer` (so the URL becomes
   `ozaluminiumrailing.ca/visualizer`).
2. Add a **Custom HTML** block (or edit `page-visualizer.php` if your theme supports
   page templates) with:

   ```html
   <iframe
     id="oz-railing-visualizer"
     src="https://YOUR-DEPLOYED-APP-URL"
     style="width:100%;border:0;min-height:900px;display:block;"
     loading="lazy"
     title="OZ Aluminium Railing Visualizer"
     allow="clipboard-write"
   ></iframe>
   <script src="https://YOUR-DEPLOYED-APP-URL/embed-resize.js"></script>
   ```

3. Replace `YOUR-DEPLOYED-APP-URL` with your Vercel URL (or custom subdomain) in both
   places.
4. Publish the page. The app auto-reports its height to the parent page (see
   `components/IframeHeightReporter.tsx`) so the iframe resizes itself as the wizard
   progresses — no awkward inner scrollbars.
5. Optional but recommended: add the page to your main navigation, and/or add a "Try
   our AI Visualizer" button on the homepage/product pages linking to `/visualizer`.

If your WordPress host or security plugin blocks iframes from other domains, allow the
deployed app's domain in your Content Security Policy / iframe allowlist settings.

## 7. Privacy & data handling notes

This app is Canadian-facing, so PIPEDA applies. A few things worth deciding
deliberately before launch:

- **Uploaded photos** may show a customer's home exterior/address context. Consider
  adding a short privacy note near the upload step (a one-line addition to
  `components/UploadStep.tsx`) and/or a retention policy — e.g. periodically deleting
  blobs older than 90 days via a small script using `@vercel/blob`'s `list`/`del`
  functions.
- **Lead information** (name, email, phone, address) is only ever sent by email via
  Resend to `COMPANY_EMAIL` — it isn't stored in a database by default. If you want a
  searchable lead history, the next step would be adding a database (Postgres via
  Vercel, Airtable, or a CRM integration) in `app/api/request-quote/route.ts`.
- **Rate limiting** (`lib/rate-limit.ts`) is in-memory and per-instance, which is
  enough to stop casual abuse but not a determined attacker, since serverless
  functions don't share memory. For real production hardening, swap in Upstash Redis
  (a few lines change in `lib/rate-limit.ts`) — flag this to your developer once
  traffic picks up.

## 7b. Brand matching (header, footer, colors, logo)

The visualizer is themed to match ozaluminiumrailing.ca so it looks native when
embedded:

- **Colors** live as CSS variables at the top of `app/globals.css` — navy
  (`--color-navy`), gold CTA (`--color-accent`), brand red (`--color-brand-red`).
  These were matched by eye from screenshots; if you have exact brand hex codes,
  drop them in there and everything updates.
- **Header/footer content** (logo, phone, email, address, nav menu, social links,
  map) is all in `lib/brand.ts` — one file to edit if anything changes.
- **Logo**: by default it loads your live logo from
  `ozaluminiumrailing.ca/wp-content/uploads/...`. If that path ever changes, the
  app automatically falls back to the bundled `public/oz-logo.svg`. To self-host
  instead, drop your logo at `public/oz-logo.png` and set `NEXT_PUBLIC_LOGO_URL`
  to `/oz-logo.png` (or just replace `public/oz-logo.svg`).
- **Font**: Poppins (loaded from Google Fonts in `app/layout.tsx`) to match the
  site's geometric sans. Swap the `<link>` there if your site uses a different
  font.
- The header nav links and footer "Quick Links" point at your real site pages, so
  they work whether the visualizer is embedded or opened on its own.

## 8. Customizing products, colors, and prompts

- **Products/options:** edit `lib/products.ts`. Each color/glass/finish has an image
  path (swap the placeholder SVGs in `public/swatches/` for real photos of your
  finishes — same filenames, or update the paths) and a `promptFragment` used to steer
  the AI edit. Each railing system has a `promptDescriptor` and `qualityNotes` used the
  same way — the more precise these are, the more accurate the AI renders your actual
  hardware.
- **AI guardrails:** `lib/prompts.ts` contains the full instruction set — what the AI
  is and isn't allowed to change, how it handles stairs/doors/existing railings, and
  the measurement-estimation logic. If you notice the AI making a specific mistake
  repeatedly (e.g. railing height, post spacing), that's the file to tighten.
- **Design:** colors and the "glass" card styling live in `app/globals.css`
  (`--color-*` variables) — change the palette there without touching components.

## 9. Regenerating placeholder images

`public/swatches/*.svg` and `public/products/*.svg` are placeholders generated by
`scripts/gen-placeholders.mjs` so the app looks complete out of the box. Once you have
real product photography and finish swatches, just replace those files directly (same
filenames) — no code changes needed.

## 10. Cost & performance notes

- Each generated preview costs one image-edit call (Gemini ~$0.039/image) plus one
  vision (scene analysis) call; each quote request adds one more vision call per photo
  for measurement estimation. Monitor usage in the Google AI Studio / Google Cloud
  billing dashboard (or OpenAI's usage dashboard if you switch providers).
- If previews occasionally take longer than ~20 seconds, that's model/load dependent.
  On OpenAI you can drop `OPENAI_IMAGE_QUALITY` to `medium`; on Gemini, generation
  time is fairly consistent. Test with real customer-style photos.
- Multiple photos in one session run their AI edits one after another as they're
  uploaded/generated — this is intentional to stay within reasonable per-request
  timeouts (`maxDuration` on the API routes).

## 11. Support

Everything above is scaffolded and working end-to-end. If something needs to change —
new railing systems, a real CRM instead of email, multi-language support, analytics —
it's a normal Next.js/React codebase and any web developer familiar with Next.js can
pick it up from here.
