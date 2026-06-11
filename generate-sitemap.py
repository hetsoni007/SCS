#!/usr/bin/env python3
"""
Auto-generate sitemap.xml for the static site.

It scans every *.html page, reads that page's own <link rel="canonical"> as the
URL (so the sitemap can never drift from canonicals), and uses the file's last
modified date for <lastmod>. Run from the repo root after adding/editing pages:

    python3 generate-sitemap.py

Excludes: 404.html, anything in .git/ or .deploy/, and any page with
<meta name="robots" content="noindex">.
"""
import os, re, glob, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
EXCLUDE_DIRS = ('.git', '.deploy')

def priority(loc):
    if loc.rstrip('/') == 'https://soniconsultancyservices.com':
        return ('1.0', 'weekly')
    if loc.rstrip('/').endswith('/blog'):
        return ('0.8', 'weekly')
    if '/blog/' in loc:
        return ('0.7', 'monthly')
    if loc.rstrip('/').endswith('/privacy'):
        return ('0.3', 'yearly')
    return ('0.8', 'monthly')

entries = []
for path in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
    rel = os.path.relpath(path, ROOT)
    if any(rel.startswith(d + os.sep) for d in EXCLUDE_DIRS) or rel == '404.html':
        continue
    html = open(path, encoding='utf-8').read()
    if re.search(r'<meta name="robots"[^>]*noindex', html):
        continue
    m = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if not m:
        print('  ! no canonical, skipped:', rel)
        continue
    loc = m.group(1)
    lastmod = datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()
    entries.append((loc, lastmod))

# sort: home first, then by priority desc, then URL
entries.sort(key=lambda e: (-float(priority(e[0])[0]), e[0]))

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, lastmod in entries:
    pr, cf = priority(loc)
    lines += ['  <url>',
              f'    <loc>{loc}</loc>',
              f'    <lastmod>{lastmod}</lastmod>',
              f'    <changefreq>{cf}</changefreq>',
              f'    <priority>{pr}</priority>',
              '  </url>']
lines.append('</urlset>')
open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(f'sitemap.xml written — {len(entries)} URLs')
for loc, lastmod in entries:
    print(' ', loc, lastmod)
