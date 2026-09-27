"""
Asset jobs for `python3 build.py --assets`: the gated downloads and the share images.

Everything here is rendered from the same content and data as the site, so the
playbook PDF and the share cards pick up any change to data/stats.json.
Chrome renders the PDFs (print-to-pdf) and PNGs (screenshot) from the HTML
written below into a temporary folder.
"""

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def esc(s):
    return html.escape(str(s), quote=False)


def _css_with_local_fonts():
    css = (PUBLIC / "assets/css/site.css").read_text("utf-8")
    fonts = (PUBLIC / "assets/fonts").resolve().as_uri() + "/"
    return css.replace("url(/assets/fonts/", "url(" + fonts)


def _absolute_links(fragment, base):
    return re.sub(r'href="/', f'href="{base}/', fragment)


PRINT_CSS = """
@page{size:A4;margin:20mm 19mm 22mm;
  @bottom-left{content:"The cold outreach playbook \\00B7  Het Soni";font:400 8pt "IBM Plex Mono",monospace;color:#5f6777}
  @bottom-right{content:counter(page);font:500 8pt "IBM Plex Mono",monospace;color:#5f6777}}
@page cover{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#fff;font-size:10.5pt}
.cover{page:cover;height:297mm;box-sizing:border-box;padding:30mm 22mm 24mm;display:flex;flex-direction:column;justify-content:space-between;border-top:6mm solid #2451c9}
.cover .kicker{font-size:9pt}
.cover h1{margin:6mm 0 0;font:500 40pt/1.02 var(--serif);letter-spacing:-.02em;max-width:150mm}
.cover .sub{margin:7mm 0 0;font-size:14pt;line-height:1.45;color:var(--ink-2);max-width:140mm}
.cover .who{font:400 10pt/1.5 var(--mono);color:var(--ink-2)}
.cover .tally{margin:0 0 8mm;border-top:1px solid var(--rule);padding-top:5mm}
.cover .tally-n{font-size:13pt}
.contents{break-before:page}
.contents h2{font:600 22pt/1.2 var(--serif);margin:0 0 8mm}
.contents ol{margin:0;padding:0;list-style:none;display:grid;gap:6mm}
.contents li{display:grid;grid-template-columns:14mm 1fr;gap:1mm 3mm}
.contents .n{grid-row:1/span 2;font:500 11pt/1.3 var(--mono);color:var(--pencil)}
.contents .t{font:600 14pt/1.25 var(--serif)}
.contents .s{color:var(--ink-2);line-height:1.5}
.piece{break-before:page}
.piece .kicker{margin-bottom:4mm}
.piece h1{margin:0;font:500 26pt/1.08 var(--serif);letter-spacing:-.015em}
.piece .dek{margin:4mm 0 0;font-size:13pt;line-height:1.45}
.piece .byline-line{margin:5mm 0 0;padding:2.5mm 0;border-block:1px solid var(--rule);font:400 8.5pt/1.4 var(--mono);color:var(--ink-3)}
.prose{display:block;max-width:none;margin:7mm 0 0}
.prose>*+*{margin-top:3.6mm}
.prose>p,.prose>ul,.prose>ol,.prose .steps li,.prose blockquote p{font-size:10.5pt;line-height:1.6}
.prose>h2{margin-top:9mm;font-size:16pt;break-after:avoid}
.prose>h3{margin-top:6mm;font-size:12pt;break-after:avoid}
.prose>h2+*,.prose>h3+*{margin-top:2.5mm}
.prose>.compare{display:grid;grid-template-columns:1fr;gap:4mm}
.count,.timeline,.ann,.check,.more,.steps li,blockquote{break-inside:avoid}
.count-row{grid-template-columns:44mm 1fr 22mm;padding:1.6mm 1mm}
.count-row:hover{background:none}
.ann-row{padding:2.5mm 4mm}
.more{display:none}
.outro{break-before:page}
.outro h2{font:600 20pt/1.2 var(--serif);margin:0 0 5mm}
.outro p,.outro li{font-size:11pt;line-height:1.6}
.outro a{color:var(--pencil)}
.outro .byline{margin-top:14mm;padding-top:4mm;border-top:1px solid var(--rule);font-size:9pt;color:var(--ink-3)}
"""

SEQ_CSS = """
@page{size:A4;margin:16mm 17mm 18mm;
  @bottom-left{content:"The two-touch outreach sequence \\00B7  Het Soni";font:400 8pt "IBM Plex Mono",monospace;color:#5f6777}
  @bottom-right{content:counter(page) " / 2";font:500 8pt "IBM Plex Mono",monospace;color:#5f6777}}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#fff;font-size:10pt;line-height:1.5}
h1{margin:2mm 0 0;font:500 26pt/1.05 var(--serif);letter-spacing:-.015em}
.sub{margin:3mm 0 7mm;font-size:12pt;color:var(--ink-2);max-width:150mm}
h2{margin:7mm 0 3mm;font:600 14pt/1.2 var(--serif);break-after:avoid}
.seq{list-style:none;margin:0;padding:0;display:grid;gap:3mm}
.seq li{display:grid;grid-template-columns:10mm 30mm 1fr;gap:3mm;padding:3mm 0;border-top:1px solid var(--rule);break-inside:avoid}
.seq .n{font:500 10pt/1.4 var(--mono);color:var(--pencil)}
.seq .h{font-weight:650}
.seq p{margin:0}
.seq p+p{margin-top:1.5mm}
.rules{margin:0;padding-left:5mm}
.rules li+li{margin-top:1.2mm}
table{width:100%;border-collapse:collapse;font-size:8.8pt}
th,td{text-align:left;vertical-align:top;padding:1.6mm 2mm 1.6mm 0;border-top:1px solid var(--rule)}
th{font-weight:600;white-space:nowrap}
td code,th code{font:400 8.3pt var(--mono)}
.muted{color:var(--ink-2)}
.byline{margin-top:6mm;padding-top:3mm;border-top:1px solid var(--rule);font-size:8.5pt;color:var(--ink-3)}
.pagebreak{break-before:page}
"""

OG_CSS = """
html,body{margin:0;background:#ffffff}
.og{box-sizing:border-box;width:1200px;height:630px;padding:58px 72px 54px;display:flex;flex-direction:column;justify-content:space-between;background:#ffffff;border-top:12px solid #2451c9}
.og-kicker{font:500 21px/1.3 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#525a69}
.og-title{margin:0;font:500 70px/1.04 var(--serif);letter-spacing:-.022em;color:#15171c;text-wrap:balance;max-width:1040px}
.og-title.is-long{font-size:60px}
.og-dek{margin:22px 0 0;font:400 28px/1.35 var(--sans);color:#525a69;max-width:980px}
.og-foot{display:flex;align-items:center;justify-content:space-between;font:400 21px/1 var(--mono);color:#525a69}
.og-mark{display:flex;align-items:center;gap:10px}
.og-mark i{display:block;width:20px;height:20px;border-radius:50%;background:#2a5bd7}
.og-mark b{display:block;width:4px;height:30px;margin-left:6px;background:#15171c;border-radius:2px}
.og-tally{display:flex;flex-wrap:wrap;gap:10px 30px;margin:26px 0 0;padding:0;list-style:none}
.og-tally li{display:flex;align-items:baseline;gap:8px}
.og-tally .tally-n{font:500 26px/1 var(--mono);color:#15171c}
.og-tally .tally-l{font:400 19px/1 var(--sans);color:#525a69}
"""


def _doc(title, css, body):
    return ("<!doctype html><html lang=\"en\" data-theme=\"light\"><head><meta charset=\"utf-8\">"
            f"<title>{esc(title)}</title><style>{_css_with_local_fonts()}{css}</style></head>"
            f"<body>{body}</body></html>")


def _tally(build):
    a = build.stats["audit"]
    names = [("threads", "threads read"), ("positive", "positive replies"), ("engaged", "real conversation"),
             ("auto_replies", "auto-replies"), ("rejections", "said no"), ("wrong_audience", "wrong audience"),
             ("silence", "silence")]
    return "".join(f'<li><span class="tally-n">{esc(a[k]["display"])}</span><span class="tally-l">{esc(l)}</span></li>'
                   for k, l in names)


def playbook_html(build):
    base = build.site["base_url"]
    arts = build.articles
    t = build.t
    cover = (
        '<section class="cover"><div>'
        '<p class="kicker">Outreach Teardowns</p>'
        '<h1>The cold outreach playbook</h1>'
        f'<p class="sub">{esc(t("An audit of {{threads}} of my own cold outreach threads, the five things that broke it, and the system I rebuilt."))}</p>'
        '</div><div>'
        f'<ul class="tally">{_tally(build)}</ul>'
        f'<p class="who">Het Soni<br>{esc(base.replace("https://", ""))}<br>{esc(build.site["published"][:7])}</p>'
        "</div></section>")
    items = "".join(
        f'<li><span class="n">{("0" + str(i)) if i < 10 else i}</span><span class="t">{esc(p.meta["title"])}</span>'
        f'<span class="s">{esc(p.meta["summary"])}</span></li>' for i, p in enumerate(arts, 1))
    contents = f'<section class="contents"><h2>In this playbook</h2><ol>{items}</ol></section>'
    pieces = ""
    for p in arts:
        kicker = esc(p.meta.get("kicker", ""))
        pieces += (
            '<section class="piece">'
            f'<p class="kicker">{kicker}</p><h1>{esc(p.meta["title"])}</h1>'
            f'<p class="dek">{esc(p.meta["dek"])}</p>'
            f'<p class="byline-line">Het Soni · {base.replace("https://", "")}{p.url}</p>'
            f'<div class="prose">{_absolute_links(p.html_body, base)}</div></section>')
    outro = (
        '<section class="outro"><h2>Use it</h2>'
        '<p>The two tools from the system run free in your browser, no login:</p><ul>'
        f'<li><a href="{base}/tools/outreach-crm/">The two-touch CRM</a>: two touches per prospect, then the thread closes. '
        'There is no button for a third.</li>'
        f'<li><a href="{base}/tools/prospect-scorer/">The prospect scorer</a>: signal, company size and days since the '
        'trigger, scored 1 to 10 with the reason.</li></ul>'
        f'<p>New teardowns go out by email when they’re written. Sign up at <a href="{base}/">{base.replace("https://", "")}</a>.</p>'
        f'<p class="byline">Built by Het Soni, founder of Soni Consultancy Services (soniconsultancyservices.com)</p>'
        "</section>")
    return _doc("The cold outreach playbook", PRINT_CSS, cover + contents + pieces + outro)


def sequence_html(build):
    t = build.t
    base = build.site["base_url"].replace("https://", "")
    sc = build.stats["scorer"]
    signal_ids = " | ".join(f"<code>{esc(s['id'])}</code>" for s in sc["signals"])
    size_ids = " | ".join(f"<code>{esc(z['id'])}</code>" for z in sc["sizes"])
    steps = [
        ("Signal", ["Start from something they said, not a job title: “redesigning our site”, "
                    "“website is live”, “our site is so slow”.",
                    t("Log the date. A launch stays on a company’s mind for about {{window_days}} days; "
                      "after that it’s background noise.")]),
        ("Person", ["Check who is actually behind the post. Can this person say yes to the work?",
                    "Founder, CTO, head of product: yes. Recruiter: no. “No agencies” in the bio: believe it."]),
        ("Audit", [t("Visit the domain. Run a PageSpeed check (about {{psi_time}}). Screenshot one finding."),
                   "Pick the finding with the clearest consequence for their business."]),
        ("Touch 1", ["Four parts: what you looked at, what you saw (one element, one number at most), why it matters "
                     "to them, and a question you actually want answered.",
                     "One or two issues, never a list. No pitch, no calendar link. Send within hours, not days."]),
        ("Touch 2, the last", ["Only with something new: a new finding, a change on their site, or a response to "
                               "what they said.",
                               "Never “just following up”. If there is nothing new, don’t send it. Close the thread."]),
        ("Close", ["A reply: it’s a conversation now, so it leaves the sequence.",
                   "A “no”: closed for good. Silence after touch 2: closed. There is no third touch."]),
    ]
    seq = "".join(
        f'<li><span class="n">{i}</span><span class="h">{esc(h)}</span><div>'
        + "".join(f"<p>{esc(x)}</p>" for x in body) + "</div></li>"
        for i, (h, body) in enumerate(steps, 1))
    cols = [
        ("name", "Who you’re writing to", ""),
        ("company", "Their company", ""),
        ("role", "Their role. Check they can say yes to the work.", ""),
        ("contact", "Email address or LinkedIn URL", ""),
        ("signal_type", "What kind of signal it was", signal_ids),
        ("company_size", "Headcount band", size_ids),
        ("signal_quote", "What they actually said", ""),
        ("signal_date", "When they said it", "<code>YYYY-MM-DD</code>"),
        ("touch1_date", "When touch 1 went out", "<code>YYYY-MM-DD</code>"),
        ("touch1_note", "The specific thing you pointed out", ""),
        ("touch2_date", "When touch 2 went out (needs touch 1)", "<code>YYYY-MM-DD</code>"),
        ("touch2_new_information", "What was new since touch 1", ""),
        ("outcome", "Blank while waiting", "<code>replied</code> | <code>said_no</code> | <code>closed_no_reply</code>"),
        ("outcome_date", "When it closed", "<code>YYYY-MM-DD</code>"),
        ("auto_replies", "How many auto-replies came in. They are not replies.", "a number"),
        ("added", "When you added them", "<code>YYYY-MM-DD</code>"),
    ]
    rows = "".join(f"<tr><th><code>{esc(c)}</code></th><td>{esc(d)}</td><td class=\"muted\">{v}</td></tr>"
                   for c, d, v in cols)
    body = (
        '<p class="kicker">Outreach Teardowns · Sequence structure</p>'
        "<h1>The two-touch outreach sequence</h1>"
        '<p class="sub">The structure behind the two-touch CRM. Every prospect gets two touches at most, and each '
        "one has to earn its place.</p>"
        f'<h2>The sequence, in order</h2><ol class="seq">{seq}</ol>'
        '<h2 class="pagebreak">The rules</h2><ul class="rules">'
        "<li>Two touches per person. There is no third.</li>"
        "<li>A “no” is final. The person is never re-added.</li>"
        "<li>Auto-replies are logged but never counted as replies.</li>"
        "<li>Contacted prospects are never deleted: deleting and re-adding someone is a third touch with extra steps.</li>"
        "<li>Count honestly: your reply rate leaves auto-replies out.</li></ul>"
        "<h2>The template, column by column</h2>"
        f"<table><thead><tr><th>Column</th><th>What goes in it</th><th>Values</th></tr></thead><tbody>{rows}</tbody></table>"
        f'<p class="byline">Import the CSV into the free CRM at {base}/tools/outreach-crm/, which enforces the same '
        "rules. Built by Het Soni, founder of Soni Consultancy Services (soniconsultancyservices.com)</p>")
    return _doc("The two-touch outreach sequence", SEQ_CSS, body)


def template_csv(build):
    cols = build.site["crm_columns"]
    example = {
        "name": "EXAMPLE, delete this row", "company": "Example Co", "role": "Founder", "contact": "name@example.com",
        "signal_type": "launch", "company_size": "11-50", "signal_quote": "website is live",
        "signal_date": build.site["published"], "touch1_date": build.site["published"],
        "touch1_note": "Hero image is the largest element on mobile. Asked if the full-size image goes to phones.",
        "touch2_date": "", "touch2_new_information": "", "outcome": "", "outcome_date": "", "auto_replies": "0",
        "added": build.site["published"],
    }

    def cell(v):
        v = str(v)
        return '"' + v.replace('"', '""') + '"' if any(c in v for c in ',"\n') else v
    return (",".join(cols) + "\r\n" + ",".join(cell(example.get(c, "")) for c in cols) + "\r\n")


def og_html(build, kicker, title, dek=None, tally=False):
    long_title = len(title) > 58
    extra = ""
    if tally:
        extra = f'<ul class="og-tally">{_tally(build)}</ul>'
    elif dek:
        extra = f'<p class="og-dek">{esc(dek)}</p>'
    body = (
        '<div class="og"><p class="og-kicker">' + esc(kicker) + "</p>"
        f'<div><h1 class="og-title{" is-long" if long_title else ""}">{esc(title)}</h1>{extra}</div>'
        '<div class="og-foot"><span class="og-mark"><i></i><i></i><b></b></span>'
        f'<span>Het Soni · {esc(build.site["base_url"].replace("https://", ""))}</span></div></div>')
    return _doc(title, OG_CSS, body)


def jobs(build, work):
    work = Path(work)
    out = []

    def page(name, content):
        f = work / name
        f.write_text(content, "utf-8")
        return f.resolve().as_uri()

    out.append({"kind": "text", "out": "downloads/two-touch-crm-template.csv", "text": template_csv(build)})
    out.append({"kind": "pdf", "out": "downloads/cold-outreach-playbook.pdf", "url": page("playbook.html", playbook_html(build))})
    out.append({"kind": "pdf", "out": "downloads/outreach-sequence-structure.pdf", "url": page("sequence.html", sequence_html(build))})

    home = build.home.meta
    out.append({"kind": "png", "out": "assets/og/home.png",
                "url": page("og-home.html", og_html(build, "Outreach Teardowns", home["title"], tally=True))})
    for p in build.articles:
        m = p.meta
        dek = None if len(m["title"]) > 58 else m["dek"]
        out.append({"kind": "png", "out": f"assets/og/{m['slug']}.png",
                    "url": page(f"og-{m['slug']}.html", og_html(build, "Outreach Teardowns · " + m["kicker"], m["title"], dek))})
    tools = [
        ("tools", "Outreach Teardowns · Tools", "Two free tools for cold outreach",
         "A CRM that caps every prospect at two touches, and a scorer that rates a prospect’s signal from 1 to 10."),
        ("outreach-crm", "Outreach Teardowns · Tool", "The two-touch CRM",
         "Two touches per prospect, then the thread closes. There’s no button for a third. Free, in your browser."),
        ("prospect-scorer", "Outreach Teardowns · Tool", "Prospect scorer",
         "Signal, company size and days since the trigger, scored 1 to 10 with the reason. Free, no login."),
    ]
    for slug, kicker, title, dek in tools:
        out.append({"kind": "png", "out": f"assets/og/{slug}.png", "url": page(f"og-{slug}.html", og_html(build, kicker, title, dek))})
    return out
