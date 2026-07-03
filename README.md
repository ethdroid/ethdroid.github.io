# Prism Wealth — Website

A static, multi-page site for Prism Wealth (Craig Peterman, CFA, CFP®).
Built with plain HTML, CSS, and JavaScript — no framework, no build step.

Maintained by Cone Media. Craig does not edit this site directly; all updates
(including Market Recap posts) are made by the maintainer.

---

## Files

Everything lives at the project root — no subfolders.

```
prism-wealth/
├── index.html              # Home
├── market-recap.html       # Feed + single-post view (uses ?post=slug)
├── regulatory.html         # Form ADV, CRS, etc.
├── disclaimers.html        # Disclosures (compliance template)
├── styles.css              # All design tokens & components
├── main.js                 # Nav, page transitions, scroll-reveal, contact form
├── posts.js                # Renders feed + single posts on market-recap.html
├── posts.json              # Market Recap content — edit this to publish
├── scoreboard.js           # Renders the YTD Scoreboard table on market-recap.html
├── scoreboard.json         # Scoreboard data — edit to update returns
├── logo.png                # Brand mark (transparent background)
└── README.md
```

---

## 1. Two things to configure before going live

### a. EmailJS (contact form) — Outlook 365 setup

**Architecture:** Connect Craig's Outlook (`cpeterman@prism-wealth.com`) as the EmailJS sending service. EmailJS authenticates as Craig's mailbox via Microsoft OAuth and sends inquiries to itself, with the visitor's email in the Reply-To header. From and To both on `prism-wealth.com` keeps everything out of Junk.

**Setup steps:**

1. **Sign up at https://www.emailjs.com.** Under Account → General, add `prism-wealth.com` (and `localhost` for testing) to **Allowed Origins**. Keep this restricted — it's the main security control.

2. **Add the Outlook service.** Email Services → Add New Service → Personal Services → Outlook 365. Name it `Prism Wealth Contact`, Service ID `prism_wealth_contact`. Click Connect Account → sign in as Craig (`cpeterman@prism-wealth.com`) on the Microsoft popup, accept the permission grant. **This step needs Craig, or his credentials, for ~60 seconds.** Then Create Service.

3. **Create the template.** Email Templates → Create New Template, Template ID `contact_inquiry`. Fields:
   - **To Email:** `cpeterman@prism-wealth.com`
   - **From Name:** `Prism Wealth Website`
   - **From Email:** default (uses the connected Outlook account)
   - **Reply To:** `{{from_email}}` — critical, so Craig's replies go to the visitor
   - **Subject:** `New inquiry from prism-wealth.com — {{from_name}}`
   - **Content** (plain-text editor):
     ```
     New inquiry submitted through prism-wealth.com

     Name:    {{from_name}}
     Email:   {{from_email}}
     Phone:   {{phone}}

     Message:
     {{message}}
     ```
   Save, then click **Test It** to send a dummy email and verify it reaches Craig's inbox with correct formatting.

4. **Get the three keys** from the EmailJS dashboard:
   - Public Key → Account → General
   - Service ID → Email Services (the value you set in step 2)
   - Template ID → Email Templates (the value you set in step 3)

5. **Paste them into `main.js`** at the top of the file:
   ```js
   const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
   const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
   const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
   ```

The rest of the integration is already wired up. `emailjs.init()` runs at page load and `emailjs.sendForm()` reads the form's `name` attributes (`from_name`, `from_email`, `phone`, `message`) and matches them to template variables automatically. If the keys remain as `'YOUR_*'` placeholders, the form shows a graceful fallback asking visitors to email Craig directly.

**Limits and gotchas:**
- Free tier: 200 emails/month. Paid starts at $9/mo for 1,000/mo.
- The Public Key is safe to expose in client-side JS — security is enforced by Allowed Origins, not by hiding the key.
- If Craig changes his Outlook password or revokes EmailJS access, sends will fail. EmailJS notifies the account owner; reconnect by re-running step 2.
- For spam protection, enable IP-based rate limiting in Account → Security → Limits before considering reCAPTCHA.
- If Craig's Microsoft 365 tenant requires admin consent for third-party apps, the OAuth grant may need approval through admin.microsoft.com → Identity → Applications.

### b. Compliance review of `disclaimers.html`

The disclosures page contains a **working template** drawn from common RIA boilerplate. **Craig and his compliance officer must review every section** before going live — required disclosures vary by state of registration, AUM, business structure, and the specific services offered.

---

## 2. Publishing Market Recap posts

All posts live in **`posts.json`** as a single array. To publish, edit that file and redeploy. There is no admin UI — this is a deliberate choice for a low-volume, manually-curated commentary feed.

### Post schema

Each entry in the array is an object with these fields:

```json
{
  "slug": "fed-pauses-june-2026",
  "title": "The Fed Pauses, the Bond Market Doesn't",
  "date": "2026-06-12",
  "category": "Macro",
  "excerpt": "A short one-or-two-sentence summary that shows in the feed.",
  "content": "Long-form body. Plain text with blank lines becomes paragraphs, or write raw HTML.",
  "media": {
    "type": "image",
    "src": "fed-june.jpg",
    "alt": "Federal Reserve building"
  }
}
```

**Field notes:**

- `slug` — URL-safe id. Becomes `market-recap.html?post=fed-pauses-june-2026`. Use lowercase, hyphens, no spaces.
- `date` — ISO format `YYYY-MM-DD`. Posts sort newest-first automatically.
- `category` — short tag shown on the feed (e.g., `Macro`, `Markets`, `Policy`, `Commentary`).
- `excerpt` — what appears in the feed list. Keep tight.
- `content` — full body. Plain text gets auto-wrapped to paragraphs. HTML passes through as-is, so `<p>`, `<h2>`, `<blockquote>`, `<strong>`, `<a href>`, `<ul><li>` all work.
- `media` — optional. Omit the key entirely if the post has no media.

### Media types

**Image:**
```json
"media": { "type": "image", "src": "chart.jpg", "alt": "S&P 500 chart" }
```
Drop the image file alongside the HTML files (project root) and reference it by filename.

**Self-hosted video:**
```json
"media": { "type": "video", "src": "clip.mp4" }
```

**YouTube or Vimeo embed:**
```json
"media": { "type": "embed", "embed": "https://www.youtube.com/watch?v=..." }
```
The renderer auto-converts watch/share URLs to embed iframes.

### Publishing workflow

1. Edit `posts.json` locally — add a new object to the top of the array.
2. Validate it parses (any JSON linter, or `python -m json.tool posts.json`).
3. If the post has an image, drop the file alongside the other site files.
4. Deploy (drag-drop to Netlify, push to git, etc. — see section 4).
5. Verify the post renders correctly on the live site.

### Empty state

When `posts.json` is `[]` (empty array), Market Recap shows a placeholder line:
*"Market commentary will appear here as it is published."* The page still loads cleanly.

---

## 3. Updating the Year-to-Date Scoreboard

The scoreboard table on Market Recap is rendered from **`scoreboard.json`**. Edit that file, save, and redeploy — same workflow as posts. Negative values automatically render in red, positives in green, zeros muted.

### Schema

```json
{
  "eyebrow": "Year-to-Date Scoreboard",
  "title":   "Index Tracking ETFs",
  "columns": ["1Q26", "Apr-26", "Thru 05/18/26", "2026 YTD"],
  "rows": [
    { "name": "S&P 500", "ticker": "SPY", "values": [-4.4, 10.5, 2.8, 8.6] }
  ],
  "footnote": "Returns depicted are the total returns of established ETFs that follow the well-known indices.",
  "sources":  "Standard & Poor's, Dow Jones, Russell, Barclays, MSCI, Yahoo Finance"
}
```

### Field notes

- **`columns`** — header labels in order, left to right after the row-name column. Update these each quarter to roll forward (e.g., shift `1Q26` to `2Q26`, change the "Thru" date, etc.).
- **`rows`** — each row has `name`, `ticker`, and a `values` array. Values must be in the same order as `columns`. Use plain numbers (`-4.4`, not strings like `"-4.4%"`); the renderer adds the `%` and the formatting.
- **`footnote`** and **`sources`** — small print below the table. Edit as needed.

### Hiding the scoreboard

If `scoreboard.json` is missing or has an empty `rows` array, the entire scoreboard section is hidden silently and the page falls back to just the intro + post feed.

---

## 4. Live Ticker (TradingView widget)

A free third-party widget from TradingView sits between Craig's intro and the scoreboard on Market Recap. It shows real-time price and daily change for the same nine ETFs as the scoreboard, scrolling horizontally. No API key needed.

### To change which tickers show

Open **`market-recap.html`**, find the comment block `Live Ticker — TradingView widget`. The `"symbols"` array inside the `<script>` block lists the tickers. Each entry has a `description` (the display label) and a `proName` (the exchange-prefixed symbol). Add, remove, or reorder entries.

### To remove the widget entirely

Delete the whole `<section class="live-ticker-section">…</section>` block from `market-recap.html`. The page reflows automatically — intro flows directly into scoreboard.

### Notes

- TradingView's license requires keeping the "Track all markets on TradingView" attribution link visible (we have a small one styled minimally at the bottom of the widget).
- The widget loads JavaScript from `s3.tradingview.com`. If Craig adds a Content Security Policy (CSP) header later, that domain needs to be allowlisted under `script-src`.
- If TradingView ever changes their embed format or pricing, the worst case is the ticker stops showing — the page below still works.

---

## 5. Regulatory Filings

Open **`regulatory.html`** and find the comment block marked `REPLACE THE href="#" VALUES BELOW`. For each filing, change `href="#"` to the actual filename, e.g.:

```html
<a class="filing" href="form-adv-part-2a.pdf" target="_blank" rel="noopener">
```

Drop the PDFs alongside the HTML files. That's it.

---

## 6. Deployment

Three good options, all free:

### Netlify (recommended)
1. Drag the `prism-wealth/` folder onto https://app.netlify.com/drop. Live in 30 seconds.
2. For ongoing updates, connect a GitHub repo and push changes; Netlify auto-deploys.
3. Add Craig's custom domain in **Site settings → Domain management**.

### Vercel
Same flow: push the folder as a repo, import to Vercel. Zero config needed for static sites.

### GitHub Pages
Push to a repo, enable Pages in **Settings → Pages → Deploy from `main`**. Free and fine for low traffic.

---

## 7. Browser support & accessibility notes

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari — current and one back).
- **Page transitions** are JS-driven (in `main.js`) and work in every browser on every protocol (file://, http://, https://). Click a link → the current page fades and lifts up (320ms) → navigation happens → the new page materializes from a soft blur (620ms). The sticky nav stays anchored so it doesn't flicker. Modifier-clicks (cmd-click, etc.) and external links bypass the transition and behave normally.
- Scroll-reveal uses `IntersectionObserver` with a safety timeout and honors `prefers-reduced-motion`.
- All interactive elements are keyboard-reachable. Nav has proper ARIA.
- Color contrast meets WCAG AA on body text (`#e8dcc2` on `#0a0908` ≈ 12.5:1).
- The brand logo (`logo.png`) has a transparent background, so it composites cleanly against any surface.
- `prefers-reduced-motion: reduce` disables all motion (transitions, reveals, page-enter/exit).

### Tweaking the transition

Two places to adjust:

1. **Durations & easing** in `styles.css` (top of the file). The entrance is 620ms with an expo-out curve; the exit is 320ms with a standard ease-in. Shorten or stretch as you like — the JS will adapt automatically.
2. **Exit hand-off timing** in `main.js` — the `EXIT_MS` constant (default `300`). Keep this ≤ the CSS exit duration so navigation feels snappy rather than laggy.

---

## 8. What's intentionally NOT included

- **No bio/about page for Craig** — per spec. Only his name appears in the contact section and footer.
- **No analytics** — add Plausible or Fathom (privacy-respecting, no cookie banner needed) if/when wanted.
- **No newsletter signup** — easy to add later by wiring another EmailJS template or a Mailchimp embed.
- **No admin UI** — posts are edited directly in `posts.json` by the maintainer.

---

## 9. Pre-launch checklist

1. Open `index.html` in a browser. Hero loads, logo shows, fonts render.
2. Click through Home → Market Recap → Regulatory → Disclosures. Each transition fades smoothly.
3. Market Recap with empty `posts.json` shows the placeholder line.
4. Add a test entry to `posts.json`, reload Market Recap. Post appears in the feed.
5. Click the post title. Single-post view loads at `?post=slug`. Document title updates.
6. Test the contact form with real EmailJS keys configured — Craig should receive the email.
7. Test on mobile width (DevTools → 375px). Nav toggle works.
8. Run Lighthouse — should score 95+ across the board on a static host.
9. Remove any test posts from `posts.json` before final deploy.

Then ship.
