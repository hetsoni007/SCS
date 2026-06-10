# Deploying to AWS S3 + CloudFront

This is a static site (plain HTML/CSS/JS, no build step). Clean URLs are served via
`folder/index.html`, so the routing setup matters. Two valid paths are below —
**Path B is recommended** because it keeps the bucket private and serves the
extensionless blog URLs (e.g. `/blog/nextjs-saas-architecture`) with **no redirect**,
which matches the `<link rel="canonical">` on every article.

---

## File structure that gets uploaded

```
index.html              404.html              favicon.svg
robots.txt              sitemap.xml           shared.css            shared.js
about/index.html        services/index.html   work/index.html
hire/index.html         contact/index.html    privacy/index.html
blog/index.html
blog/ai-agent-development-services/index.html
blog/ai-app-development-cost-2026/index.html
blog/build-vs-buy-ai-cto-framework/index.html
blog/react-native-vs-flutter-2026/index.html
blog/nextjs-saas-architecture/index.html
blog/mvp-to-product-market-fit/index.html
```

All asset links are root-relative (`/shared.css`, `/shared.js`, `/favicon.svg`), so they
only resolve correctly once served from the bucket/CloudFront root — not from `file://`.

---

## 1. Create and fill the bucket

```bash
aws s3 mb s3://soniconsultancyservices.com --region eu-west-2

# Sync everything except git/docs/system files
aws s3 sync . s3://soniconsultancyservices.com \
  --exclude ".git/*" --exclude ".DS_Store" --exclude "*/.DS_Store" \
  --exclude "README.md" --exclude "DEPLOY.md"
```

`aws s3 sync` sets `Content-Type` automatically for `.html`, `.css`, `.js`, `.svg`,
`.xml`, `.txt`. Verify a couple after upload if unsure:

```bash
aws s3api head-object --bucket soniconsultancyservices.com --key shared.css   # text/css
aws s3api head-object --bucket soniconsultancyservices.com --key favicon.svg  # image/svg+xml
```

---

## Path B — REST origin + OAC + CloudFront Function (recommended)

Bucket stays **private**. CloudFront reads it through Origin Access Control, and a
CloudFront Function rewrites "directory" requests to the right `index.html`.

### B1. Keep the bucket private
Block all public access (default). Do **not** enable static website hosting on this path.

### B2. Create the CloudFront distribution
- **Origin:** the bucket's REST endpoint (`soniconsultancyservices.com.s3.eu-west-2.amazonaws.com`)
- **Origin access:** Origin Access Control (OAC) → let the console update the bucket policy for you
- **Viewer protocol policy:** Redirect HTTP → HTTPS
- **Default root object:** `index.html`

### B3. Add the URL-rewrite CloudFront Function
Create a **Function** (not Lambda@Edge), associate it to the **Viewer Request** event of
the default behavior. This turns `/about/` → `/about/index.html` and
`/blog/nextjs-saas-architecture` → `/blog/nextjs-saas-architecture/index.html` with no redirect:

```js
function handler(event) {
  var req = event.request;
  var uri = req.uri;
  if (uri.endsWith('/')) {
    req.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    req.uri = uri + '/index.html';
  }
  return req;
}
```

### B4. Custom error responses
With OAC, S3 returns **403** for missing keys (not 404). Map both to the branded page:

| HTTP error code | Response page path | HTTP response code |
|---|---|---|
| 403 | `/404.html` | 404 |
| 404 | `/404.html` | 404 |

### B5. Domain + TLS
- Add `soniconsultancyservices.com` (and `www`) as **Alternate domain names (CNAMEs)**.
- Attach an **ACM certificate in `us-east-1`** (CloudFront only reads certs from us-east-1).
- In Route 53, point the apex (and `www`) at the distribution with an **A / AAAA Alias** record.

---

## Path A — S3 website endpoint (simpler, bucket public)

Use this only if you want to avoid the CloudFront Function.

1. **Enable static website hosting** on the bucket: Index document `index.html`,
   Error document `404.html`.
2. Make objects public (bucket policy granting `s3:GetObject` to `*`).
3. CloudFront **Origin** = the **website** endpoint
   (`...s3-website-eu-west-2.amazonaws.com`) as a **custom origin (HTTP only)** —
   **not** the REST endpoint.
4. Subfolder index docs resolve automatically.

> ⚠️ Trade-off: requesting `/blog/nextjs-saas-architecture` (no trailing slash) returns a
> **302 → `/blog/nextjs-saas-architecture/`**. It works, but the served URL then has a
> trailing slash while the page's `canonical` does not. Path B avoids this entirely.

---

## 2. Cache headers (optional but recommended)

HTML should revalidate; static assets can cache long if you invalidate on deploy.

```bash
# Long-cache fingerprint-free assets, but plan to invalidate on every deploy
aws s3 cp shared.css s3://soniconsultancyservices.com/shared.css \
  --content-type text/css --cache-control "public,max-age=86400" --metadata-directive REPLACE
aws s3 cp shared.js s3://soniconsultancyservices.com/shared.js \
  --content-type application/javascript --cache-control "public,max-age=86400" --metadata-directive REPLACE
```

---

## 3. Invalidate CloudFront after each deploy

```bash
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

---

## Deploy checklist

- [ ] `aws s3 sync` completed (excludes `.git`, `.DS_Store`, `README.md`, `DEPLOY.md`)
- [ ] CloudFront Function attached to Viewer Request (Path B)
- [ ] Custom error responses 403 + 404 → `/404.html` (Path B) — or Error document `404.html` (Path A)
- [ ] ACM cert in **us-east-1**, CNAMEs added, Route 53 alias set
- [ ] CloudFront invalidation run
- [ ] Spot-check live: `/`, `/about/`, `/blog/`, `/blog/nextjs-saas-architecture`,
      `/contact/` (form + FAQ), theme toggle persists, a bad URL shows the 404 page
