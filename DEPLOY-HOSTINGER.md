# Deploying STAR AVS to Hostinger

The site is a static build (React/Vite) **plus one PHP endpoint** for the AI
assistant. Hostinger shared hosting (Apache/LiteSpeed + PHP) runs this as-is —
no Node server needed in production.

## 1. Build

```bash
cd staravs
npm install
npm run build
```

This produces `dist/`, including:
- `dist/index.html`, `dist/assets/…`, `dist/images/…` — the website
- `dist/api/chat.php` — the Gemini proxy (keeps the key server-side)
- `dist/api/ai-context.json` — product catalogue + prompt (auto-generated from the app's product DB)
- `dist/.htaccess` — security + caching

## 2. Upload

Upload **the contents of `dist/`** into your Hostinger `public_html/`
(so you get `public_html/index.html` and `public_html/api/chat.php`).

## 3. Add the Gemini API key (server-side only)

Get a key from Google AI Studio, then choose ONE:

- **Recommended:** create a file named `.env` **one level above `public_html`**
  (e.g. `/home/uXXXX/.env`) containing:
  ```
  GEMINI_API_KEY=your_key_here
  ```
  `api/chat.php` reads it automatically and it is not web-accessible.

- Or set an environment variable `GEMINI_API_KEY` in hPanel (if available).

- Or place `.env` inside `public_html` (already blocked from web access by `.htaccess`).

Optional: `GEMINI_MODEL=gemini-3.6-flash` (default). Temperature defaults to 0.6.

## 4. Verify

- Open the site, scroll, open **STAR AV Assist**, and send a message.
- Replies are generated live by Gemini. If the key is missing or the API is
  unreachable, the assistant shows an honest error state (with Call/WhatsApp
  options) — it never fabricates an answer.
- `https://yourdomain/api/ai-context.json` and `.env` should return **403**
  (blocked); `api/chat.php` only accepts POST.

## Notes
- **Requirement:** PHP with the cURL extension (standard on Hostinger).
- The key is never sent to the browser and never committed to git.
- Re-run `npm run build` and re-upload `dist/` whenever the product database or
  copy changes — `ai-context.json` regenerates automatically.
