# OZ Aluminium Railing Visualizer — Plain-English Setup Guide

This guide is written for someone who has **never** set up an API key or deployed
a web app before. Take it one numbered step at a time. There are two parts:

- **Part 1 — Your Google Gemini key** (the "AI brain" that generates the previews)
- **Part 2 — Putting it live on your WordPress site** at `/visualizer`

You do Part 1 and Part 2 together at the end (the key gets pasted into the hosting
service). Total time: about 30–45 minutes the first time.

> The app uses **Google Gemini** as the image engine by default (it's cheaper and
> especially good at keeping the rest of your photo untouched while adding the
> railing). It can also run on OpenAI instead — see "Using OpenAI instead" near
> the end — but this guide assumes Gemini.

---

# Part 1 — The Google Gemini API key

## What an API key actually is (30-second version)

Think of the API key as a **secret password that lets your visualizer app use
Google's AI on your account's tab**. Every time a customer clicks "Create
Visualization":

1. Your app quietly sends their photo + your railing instructions to Google,
   signed with your key.
2. Google's AI edits the photo (adds the railing) and sends the image back.
3. Google charges your account a **few cents** for that image.

The key lives **only on the server** (inside the hosting settings). Customers
never see it, and it never appears in the browser. If a key ever leaks, you just
delete it and make a new one — nothing else breaks.

## What it costs

You pay Google per image generated (pay-as-you-go). Current price (as of July
2026 — always check the live pricing page, it changes):

| What | Cost |
|---|---|
| Gemini 2.5 Flash Image — per generated preview | **~$0.039** (about 4 cents) |
| Photo analysis + measurement read (per preview) | a fraction of a cent |

So each preview a customer generates costs you roughly **4 cents**. If 500 people
generate a preview in a month, that's about **$20**. (For comparison, the same on
OpenAI's high-quality setting would be ~3x more.) You can also set a spending cap
in Google Cloud if you want a hard ceiling.

## Step-by-step: create the key

1. Go to **https://aistudio.google.com** and sign in with a Google account (use a
   **business Google account** for the company if you can, rather than a personal
   Gmail — keeps ownership and billing clean).
2. Click **"Get API key"** (top of the page, or in the left menu).
3. Click **"Create API key"**. If it asks which Google Cloud project to use, let
   it create a new one for you (the default is fine).
4. **Copy the key** it shows you and paste it somewhere safe for a few minutes —
   you'll drop it into the hosting settings in Part 2. If you lose it, you can
   always come back and create another.
5. **Turn on billing / paid tier** so it works for real traffic: Google gives a
   limited free tier, but for a public tool on your website you'll want the paid
   tier. In AI Studio, open **"Get API key" → your project → "Set up billing"**
   (or do it in the Google Cloud console for that project) and add a company card.
   Optionally set a budget alert in Google Cloud → Billing → Budgets so you're
   emailed if spend passes a threshold.

That's it. You do **not** need to touch any code. The key is just a value you'll
paste into a settings box in Part 2.

## (Optional) The other two keys

The visualizer also emails each quote request to your team and stores the photos.
These use the same idea (paste a key into settings) and are optional to start:

- **Resend** (email — so quote requests land in your inbox): sign up at
  **resend.com**, verify your domain (add a couple of DNS records they give you),
  and create an API key. Without this, the app works but the "Request Final Quote"
  button can't send the email.
- **Vercel Blob** (photo storage): this one is created **for you** automatically
  when you deploy on Vercel in Part 2 — you don't sign up separately.

You can launch with just the Gemini key to test the AI, and add Resend when you
want the quote emails flowing.

---

# Part 2 — Putting it live on your WordPress site

## The key concept (why we can't just "upload it to WordPress")

Your visualizer is a **Next.js app** — it needs a computer that runs Node.js to
do the AI work. WordPress can't run that itself. So the setup is:

```
[ Your visualizer app ]  →  hosted on Vercel (free to start)
          ⭣  embedded via an iframe (one small snippet)
[ Your WordPress site ]  →  a new page at ozaluminiumrailing.ca/visualizer
```

Customers never know there are two pieces — they just see the visualizer sitting
inside your website, wrapped by your normal header and footer. This is the same
way lots of sites embed booking tools, maps, or calculators.

## Step A — Put the app on Vercel (the host)

1. Create a free account at **https://vercel.com** — click **Sign up** and choose
   "Continue with GitHub" (make a free GitHub account first at github.com if you
   don't have one; it's where the code lives).
2. Get the code into GitHub. Easiest non-technical way: send the project ZIP I
   gave you to whoever helps with your website, and ask them to "push this Next.js
   project to a new GitHub repo and import it into Vercel." If you're doing it
   yourself, GitHub's **"upload files"** button on a new repository works for the
   unzipped folder.
3. In Vercel, click **Add New… → Project**, and **Import** the GitHub repo. Vercel
   auto-detects Next.js — you don't change any build settings.
4. **Before clicking Deploy**, open the **Environment Variables** section and add:
   - `GEMINI_API_KEY` = the key from Part 1
   - (optional) `RESEND_API_KEY`, `EMAIL_FROM`, `COMPANY_EMAIL` for quote emails
   Then click **Deploy**. Wait ~1–2 minutes.
5. Add photo storage: in your new Vercel project go to **Storage → Create
   Database → Blob → Create**. Vercel adds the `BLOB_READ_WRITE_TOKEN` for you.
   Then **Deployments → … → Redeploy** once so it picks that up.
6. Vercel gives you a live URL like **`railing-visualizer.vercel.app`**. Open it —
   you should see your branded visualizer. **This URL is what WordPress will
   embed.** (Optional: under Settings → Domains you can make it
   `app.ozaluminiumrailing.ca` instead, so no "vercel.app" shows anywhere.)

## Step B — Add the `/visualizer` page in WordPress

1. Log into WordPress → **Pages → Add New**.
2. Title it **Visualizer**. Make sure the URL slug is `visualizer` (so it becomes
   `ozaluminiumrailing.ca/visualizer`) — you can see/edit the slug in the page
   settings on the right.
3. Add a **Custom HTML** block (click the ➕, search "Custom HTML") and paste this,
   replacing `YOUR-VERCEL-URL` with the URL from Step A:

   ```html
   <iframe
     id="oz-railing-visualizer"
     src="https://YOUR-VERCEL-URL"
     style="width:100%;border:0;min-height:1000px;display:block;"
     loading="lazy"
     title="OZ Aluminium Railing Visualizer"
   ></iframe>
   <script src="https://YOUR-VERCEL-URL/embed-resize.js"></script>
   ```

   (The little script makes the frame grow/shrink automatically so there's no
   awkward inner scrollbar. It's already included in the app.)
4. Click **Publish**.
5. Add it to your menu: **Appearance → Menus** (or your theme's menu editor) →
   add the Visualizer page → Save. Now it shows up in your navigation just like
   Home, About, Gallery, etc.

## Step C — Test it

Open `ozaluminiumrailing.ca/visualizer`, upload a deck/porch photo, pick a system
and options, and click **Create Visualization**. Within ~20 seconds you should see
the before/after. If you configured Resend, submit a test quote and check that the
email arrives at info@ozaluminiumrailing.ca.

---

# Quick reference — where each setting goes

Everything below is pasted into **Vercel → your project → Settings → Environment
Variables** (never into WordPress, never into the code):

| Setting | What it's for | Required? |
|---|---|---|
| `GEMINI_API_KEY` | The AI that generates previews | **Yes** |
| `AI_PROVIDER` | `gemini` (default) or `openai` | No |
| `RESEND_API_KEY` | Sends quote-request emails | For emails |
| `EMAIL_FROM` | The "from" address (on your verified domain) | For emails |
| `COMPANY_EMAIL` | Where quotes are sent (info@ozaluminiumrailing.ca) | For emails |
| `BLOB_READ_WRITE_TOKEN` | Photo storage | Added by Vercel automatically |

## Using OpenAI instead (optional)

If you ever want to switch back to OpenAI, set `AI_PROVIDER=openai` and add
`OPENAI_API_KEY` in Vercel — no code changes. Everything else works the same. See
`.env.example` for the full list of OpenAI-specific settings.

## If something doesn't work

- **"Create Visualization" errors** → the Gemini key is missing/wrong in Vercel,
  or billing isn't enabled on your Google project. Re-check Part 1.
- **The preview never sends an email** → Resend key missing, or your sending
  domain isn't verified yet in Resend.
- **The frame looks cut off / has a scrollbar** → make sure you pasted the
  `embed-resize.js` `<script>` line too, not just the iframe.
- **You want to change colors, contact info, or the menu** → those live in
  `app/globals.css` and `lib/brand.ts` (see the main README, section 7b).

You never edit code to run this — the only things you touch are the Google AI
Studio dashboard, the Vercel settings, and one WordPress page. If you get stuck on
any single step, tell me which number and I'll walk you through it.
