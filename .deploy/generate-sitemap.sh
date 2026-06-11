#!/usr/bin/env bash
# =====================================================================
# generate-sitemap.sh — regenerate sitemap.xml from the pages themselves.
# Scans every *.html, reads its <link rel="canonical">, and emits a
# sitemap with <lastmod> (file modified date). New pages are picked up
# automatically as long as they carry a self-referencing canonical.
# Excludes 404 and any noindex page. Run:  bash .deploy/generate-sitemap.sh
# =====================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 - "$ROOT" <<'PY'
import os, re, sys, glob, datetime
root = sys.argv[1]
HOME = "https://soniconsultancyservices.com"
urls = []
for f in glob.glob("**/*.html", recursive=True):
    if f.startswith(".git/") or f.startswith(".deploy/"):
        continue
    if os.path.basename(f) == "404.html":
        continue
    s = open(f, encoding="utf-8").read()
    robots = (re.search(r'<meta name="robots" content="([^"]*)"', s) or [None, ""])[1]
    if "noindex" in robots:
        continue
    m = re.search(r'<link rel="canonical" href="([^"]+)"', s)
    if not m:
        print("  ! skipped (no canonical):", f, file=sys.stderr)
        continue
    loc = m.group(1)
    lastmod = datetime.date.fromtimestamp(os.path.getmtime(f)).isoformat()
    urls.append((loc, lastmod))

# de-dupe, homepage first, then alphabetical
urls = sorted(set(urls), key=lambda u: (u[0].rstrip("/") != HOME, u[0]))

out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, lastmod in urls:
    priority = "1.0" if loc.rstrip("/") == HOME else ("0.8" if loc.count("/") <= 3 else "0.7")
    out += ["  <url>",
            "    <loc>%s</loc>" % loc,
            "    <lastmod>%s</lastmod>" % lastmod,
            "    <priority>%s</priority>" % priority,
            "  </url>"]
out.append("</urlset>")
open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("Wrote sitemap.xml with %d URLs:" % len(urls))
for loc, _ in urls:
    print("   ", loc)
PY
