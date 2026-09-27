#!/usr/bin/env python3
"""
Local preview server that behaves like the production CloudFront setup:
clean URLs (/articles/the-audit/ -> index.html), the branded 404 page, and the
exact security headers recommended in README.md (CSP included), so a CSP
mistake shows up here as a console error before it ever ships.

    python3 scripts/serve.py            # http://127.0.0.1:5180
    python3 scripts/serve.py 8000

Forms stay in dry-run mode on localhost: nothing is sent to the lead endpoint.
"""
import base64
import hashlib
import http.server
import os
import re
import sys
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"
ENDPOINT = "https://9cjt6qwy71.execute-api.ap-south-1.amazonaws.com"


def boot_hash():
    html = (PUBLIC / "index.html").read_text("utf-8")
    boot = re.search(r"<script>(.*?)</script>", html, re.S).group(1)
    return "sha256-" + base64.b64encode(hashlib.sha256(boot.encode()).digest()).decode()


def headers():
    csp = ("default-src 'self'; "
           f"script-src 'self' '{boot_hash()}'; "
           "style-src 'self' 'unsafe-inline'; "
           "img-src 'self' data:; "
           "font-src 'self'; "
           f"connect-src 'self' {ENDPOINT}; "
           "form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'")
    return {
        "Content-Security-Policy": csp,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    }


class Handler(http.server.SimpleHTTPRequestHandler):
    extra = {}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(PUBLIC), **k)

    def end_headers(self):
        for k, v in self.extra.items():
            self.send_header(k, v)
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        body = (PUBLIC / "404.html").read_bytes()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if os.environ.get("VERBOSE"):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5180
    Handler.extra = headers()
    print(f"Serving {PUBLIC} at http://127.0.0.1:{port}/ with production-like headers. Ctrl+C to stop.")
    print("CSP:", Handler.extra["Content-Security-Policy"])
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
