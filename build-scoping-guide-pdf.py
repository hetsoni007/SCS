#!/usr/bin/env python3
"""
Build the free App Scoping Guide PDF for /app-scoping-guide/.

CONTENT SOURCING RULE (see CLAUDE.md hard rules):
Every factual claim below is already published on soniconsultancyservices.com.
- Timelines: real case-study durations shown on /work/ (16/24/25/26/32 weeks)
- Tier framework: /blog/react-native-app-development-cost/
- "low five figures" MVP framing: /contact/ and /react-native-app-development/ FAQs
- 4-step process: /react-native-app-development/ process section
No SCS pricing figures, client names, or metrics are invented here.
"""
import fitz

GOLD = (0.788, 0.635, 0.294)       # #C9A24B
INK = (0.09, 0.09, 0.11)
BODY = (0.28, 0.29, 0.33)
MUTED = (0.48, 0.49, 0.54)
RULE = (0.87, 0.87, 0.89)
WASH = (0.976, 0.973, 0.965)

PAGE_W, PAGE_H = fitz.paper_size("a4")
MARGIN = 58
CONTENT_W = PAGE_W - (MARGIN * 2)

CSS = f"""
* {{ font-family: sans-serif; }}
body {{ color: rgb(71,74,84); font-size: 10.5pt; line-height: 1.65; }}
h1 {{ font-size: 30pt; color: rgb(23,23,28); line-height: 1.15; margin: 0 0 10pt 0; }}
h2 {{ font-size: 16pt; color: rgb(23,23,28); line-height: 1.25; margin: 0 0 4pt 0; }}
h3 {{ font-size: 11.5pt; color: rgb(23,23,28); line-height: 1.35; margin: 0 0 3pt 0; }}
p  {{ margin: 0 0 9pt 0; }}
.eyebrow {{ font-size: 8pt; color: rgb(201,162,75); letter-spacing: 1.4pt; margin: 0 0 8pt 0; }}
.lead {{ font-size: 12pt; color: rgb(71,74,84); line-height: 1.6; margin: 0 0 12pt 0; }}
.muted {{ color: rgb(122,125,138); }}
.small {{ font-size: 9pt; line-height: 1.55; }}
.q {{ font-size: 13pt; color: rgb(23,23,28); margin: 0 0 5pt 0; }}
.why {{ color: rgb(71,74,84); margin: 0 0 4pt 0; }}
.listen {{ color: rgb(122,125,138); font-size: 9.5pt; margin: 0 0 2pt 0; }}
b, strong {{ color: rgb(23,23,28); }}
li {{ margin: 0 0 5pt 0; }}
"""


def draw_frame(page, first=False):
    """Hairline rules + footer on every page."""
    if not first:
        page.draw_line(fitz.Point(MARGIN, 46), fitz.Point(PAGE_W - MARGIN, 46),
                       color=RULE, width=0.6)
        page.insert_text(fitz.Point(MARGIN, 40), "App Scoping Guide",
                         fontname="helv", fontsize=8, color=MUTED)
        page.insert_text(fitz.Point(PAGE_W - MARGIN - 96, 40), "Soni Consultancy Services",
                         fontname="helv", fontsize=8, color=MUTED)
    page.draw_line(fitz.Point(MARGIN, PAGE_H - 46), fitz.Point(PAGE_W - MARGIN, PAGE_H - 46),
                   color=RULE, width=0.6)
    page.insert_text(fitz.Point(MARGIN, PAGE_H - 32),
                     "soniconsultancyservices.com",
                     fontname="helv", fontsize=8, color=MUTED)


def render_story(html, top=78, bottom=62):
    """Flow HTML into as many pages as it needs; returns a fitz.Document."""
    import io
    buf = io.BytesIO()
    writer = fitz.DocumentWriter(buf)
    story = fitz.Story(html=html, user_css=CSS)
    mediabox = fitz.Rect(0, 0, PAGE_W, PAGE_H)
    where = fitz.Rect(MARGIN, top, PAGE_W - MARGIN, PAGE_H - bottom)
    more = True
    while more:
        device = writer.begin_page(mediabox)
        more, _ = story.place(where)
        story.draw(device)
        writer.end_page()
    writer.close()
    buf.seek(0)
    return fitz.open("pdf", buf.read())


def draw_closing_page(doc):
    """Designed final page: the call to action, with clickable links."""
    p = doc.new_page(width=PAGE_W, height=PAGE_H)
    p.draw_rect(fitz.Rect(0, 0, PAGE_W, PAGE_H), color=None, fill=(1, 1, 1))
    p.draw_rect(fitz.Rect(0, 0, PAGE_W, 8), color=None, fill=GOLD)

    y = 150
    p.insert_text(fitz.Point(MARGIN, y), "NEXT STEP",
                  fontname="hebo", fontsize=9, color=GOLD)
    y += 44
    for line in ["If you'd like", "a second opinion."]:
        p.insert_text(fitz.Point(MARGIN, y), line,
                      fontname="hebo", fontsize=30, color=INK)
        y += 38

    y += 16
    for line in [
        "A 30-minute scoping call. No obligation, no pitch deck:",
        "your idea, an honest read on feasibility, and a fixed-price",
        "proposal within 48 hours if it's a fit.",
    ]:
        p.insert_text(fitz.Point(MARGIN, y), line,
                      fontname="helv", fontsize=12, color=BODY)
        y += 20

    y += 8
    p.insert_text(fitz.Point(MARGIN, y), "If it isn't a fit, we'll tell you on the call.",
                  fontname="hebo", fontsize=12, color=INK)

    # link rows
    y += 52
    rows = [
        ("Book a call", "soniconsultancyservices.com/contact",
         "https://soniconsultancyservices.com/contact/"),
        ("Estimate your scope", "soniconsultancyservices.com/app-cost-calculator",
         "https://soniconsultancyservices.com/app-cost-calculator/"),
        ("Email", "het.soni@soniconsultancyservices.com",
         "mailto:het.soni@soniconsultancyservices.com"),
    ]
    for label, shown, uri in rows:
        p.draw_line(fitz.Point(MARGIN, y - 20), fitz.Point(PAGE_W - MARGIN, y - 20),
                    color=RULE, width=0.6)
        p.insert_text(fitz.Point(MARGIN, y), label,
                      fontname="hebo", fontsize=10, color=INK)
        p.insert_text(fitz.Point(MARGIN + 150, y), shown,
                      fontname="helv", fontsize=10, color=GOLD)
        w = fitz.get_text_length(shown, fontname="helv", fontsize=10)
        p.insert_link({
            "kind": fitz.LINK_URI, "uri": uri,
            "from": fitz.Rect(MARGIN + 150, y - 11, MARGIN + 150 + w, y + 4),
        })
        y += 40

    # footer block
    p.draw_rect(fitz.Rect(0, PAGE_H - 150, PAGE_W, PAGE_H), color=None, fill=WASH)
    fy = PAGE_H - 108
    p.insert_text(fitz.Point(MARGIN, fy), "Soni Consultancy Services",
                  fontname="hebo", fontsize=13, color=INK)
    for i, line in enumerate([
        "React Native & MERN app development, with AI where it earns its place.",
        "Products live on the App Store & Google Play.",
    ]):
        p.insert_text(fitz.Point(MARGIN, fy + 22 + i * 15), line,
                      fontname="helv", fontsize=9.5, color=BODY)
    p.insert_text(fitz.Point(MARGIN, fy + 62),
                  "This guide is free to share. Please don't repackage it as your own.",
                  fontname="helv", fontsize=8.5, color=MUTED)


def build():
    doc = fitz.open()

    # ---------------- COVER ----------------
    cover = doc.new_page(width=PAGE_W, height=PAGE_H)
    cover.draw_rect(fitz.Rect(0, 0, PAGE_W, PAGE_H), color=None, fill=(1, 1, 1))
    cover.draw_rect(fitz.Rect(0, 0, PAGE_W, 8), color=None, fill=GOLD)
    cover.draw_rect(fitz.Rect(0, PAGE_H - 232, PAGE_W, PAGE_H), color=None, fill=WASH)

    y = 150
    cover.insert_text(fitz.Point(MARGIN, y), "FREE GUIDE",
                      fontname="hebo", fontsize=9, color=GOLD, render_mode=0)
    # letterspacing emulation for the eyebrow
    y += 46
    for line in ["Scope Your App", "Like a Founder,", "Not a Salesperson."]:
        cover.insert_text(fitz.Point(MARGIN, y), line,
                          fontname="hebo", fontsize=32, color=INK)
        y += 40

    y += 14
    sub = ("The five questions to ask before you build,",
           "what a realistic timeline looks like, and how",
           "to tell a good build partner from a bad one.")
    for line in sub:
        cover.insert_text(fitz.Point(MARGIN, y), line,
                          fontname="helv", fontsize=13, color=BODY)
        y += 21

    cover.draw_line(fitz.Point(MARGIN, y + 18), fitz.Point(MARGIN + 62, y + 18),
                    color=GOLD, width=2.5)

    fy = PAGE_H - 180
    cover.insert_text(fitz.Point(MARGIN, fy), "Written by",
                      fontname="helv", fontsize=9, color=MUTED)
    cover.insert_text(fitz.Point(MARGIN, fy + 20), "Soni Consultancy Services",
                      fontname="hebo", fontsize=14, color=INK)
    for i, line in enumerate([
        "React Native & MERN app development studio.",
        "Products live on the App Store & Google Play.",
    ]):
        cover.insert_text(fitz.Point(MARGIN, fy + 42 + i * 15),
                          line, fontname="helv", fontsize=9.5, color=BODY)
    cover.insert_text(fitz.Point(MARGIN, fy + 92), "soniconsultancyservices.com",
                      fontname="hebo", fontsize=10, color=GOLD)
    cover.insert_text(fitz.Point(MARGIN, fy + 110), "het.soni@soniconsultancyservices.com",
                      fontname="helv", fontsize=9.5, color=BODY)

    # ---------------- BODY ----------------
    html = """
<p class="eyebrow">START HERE</p>
<h2>Why most app projects go wrong before a line of code</h2>
<p>Most failed app builds are not failures of engineering. They are failures of
scoping &mdash; decisions made, or avoided, in the two weeks before anyone opened
an editor.</p>
<p>Three patterns cause most of the damage:</p>
<p><b>Scope creep.</b> Features get added mid-build because nobody decided
up front what was version one and what was later. The timeline doubles and the
budget follows it.</p>
<p><b>The wrong technical choice.</b> A stack gets picked because it is familiar
to someone in the room, not because it fits the product. The bill arrives six
months later, as a rewrite.</p>
<p><b>The wrong build partner.</b> The cheapest quote wins because the buyer had
no way to tell a serious proposal from an optimistic one. What ships cannot
scale, and the rescue costs more than doing it properly would have.</p>
<p>None of these need deep technical knowledge to avoid. They need better
questions, asked earlier. That is what this guide is.</p>
<p class="small muted">This guide is deliberately vendor-neutral. Whether you
build with us, hire in-house, or go to another studio entirely, the framework
below is the same.</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION ONE</p>
<h2>The five questions to answer before you build</h2>
<p>Answer these honestly and you have a real scope. Skip them and you have a
wish list that will be priced as one.</p>

<p>&nbsp;</p>
<p class="q"><b>1. What is the one thing this product must do to be worth
launching?</b></p>
<p class="why">Not the five things. The one. If you cannot finish the sentence
"this is a failure unless it can ___", the scope is not ready. Everything that
does not serve that sentence is version two.</p>
<p class="listen"><b>Good sign:</b> you can state it in a sentence, without "and".</p>
<p class="listen"><b>Warning sign:</b> every feature feels equally essential.</p>

<p>&nbsp;</p>
<p class="q"><b>2. Who is the first user, and what do they do today instead?</b></p>
<p class="why">Every product replaces something &mdash; a spreadsheet, a phone
call, a competitor, or doing nothing at all. The thing you are replacing sets
the bar you have to clear, and it tells you which features are genuinely
required on day one.</p>
<p class="listen"><b>Good sign:</b> you can name a specific person and describe
their current workaround.</p>
<p class="listen"><b>Warning sign:</b> the answer is a demographic, not a
person.</p>

<p>&nbsp;</p>
<p class="q"><b>3. What has to be true on the back end?</b></p>
<p class="why">The screens are the visible part and usually the cheaper part.
Real-time updates, payments, offline behaviour, role-based access, third-party
integrations and data volume drive far more of the cost than screen count does.
This is the question that most often moves a quote by a factor of two.</p>
<p class="listen"><b>Good sign:</b> you have listed the systems it must talk to.</p>
<p class="listen"><b>Warning sign:</b> "it's just a simple app".</p>

<p>&nbsp;</p>
<p class="q"><b>4. What is the real constraint &mdash; the date, the budget, or
the scope?</b></p>
<p class="why">One of these three is fixed and the other two have to flex. If
you do not decide which, the decision gets made for you halfway through, usually
badly. A team that knows your real constraint can protect it. A team that
doesn't will optimise for the wrong one.</p>
<p class="listen"><b>Good sign:</b> you can say which of the three you would
sacrifice first.</p>
<p class="listen"><b>Warning sign:</b> all three are non-negotiable.</p>

<p>&nbsp;</p>
<p class="q"><b>5. What happens the day after launch?</b></p>
<p class="why">Launch is the start of the cost, not the end of it. App stores
require ongoing releases, OS versions change, and real usage produces work that
no plan anticipated. Budgets that stop at launch day tend to strand the product
a few months later.</p>
<p class="listen"><b>Good sign:</b> there is an owner and a budget line for
month four.</p>
<p class="listen"><b>Warning sign:</b> the plan ends at "live on the store".</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION TWO</p>
<h2>Cutting scope to a real version one</h2>
<p>The fastest way to a shippable scope is to sort every feature into three
buckets and be strict about the first one.</p>
<p><b>Core.</b> Without it, the product does not do its one job. If you can
describe a usable product without the feature, it is not core.</p>
<p><b>Supporting.</b> It makes the core work properly &mdash; sign-in, basic
settings, whatever the core genuinely depends on. Keep this list short and
suspicious.</p>
<p><b>Later.</b> Everything else. Not "cut" &mdash; scheduled. This distinction
matters, because a feature that is written down as later stops being argued
about weekly.</p>
<p>A practical test: for each feature, ask what actually happens if it ships
three months after launch instead. If the answer is "some users would find it
inconvenient", it is not core. If the answer is "the product makes no sense",
it is.</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION THREE</p>
<h2>What a realistic timeline looks like</h2>
<p>Timelines below are <b>engineering effort</b> &mdash; the working time of a
senior team &mdash; not calendar time with more people added. Adding people to
a late project reliably makes it later, because coordination cost grows faster
than output.</p>
<p>These bands come from products we have actually shipped to the App Store and
Google Play. Client names are withheld under NDA; the durations are real.</p>

<p>&nbsp;</p>
<h3>MVP / simple &mdash; roughly 10 to 16 weeks</h3>
<p class="small">A focused product proving one core loop: a handful of screens,
standard authentication, a straightforward backend, one or two integrations.
This is what you build to test demand. Typically one to two senior engineers
with part-time design. An attendance and payroll platform we built shipped in
around 16 weeks, at the fuller end of this band.</p>

<h3>Standard / market-ready &mdash; roughly 24 to 32 weeks</h3>
<p class="small">A polished product with several connected modules, custom
interface work, real-time features, payments and a proper admin side. Most
funded products land here. Typically two to four engineers plus dedicated
design and QA. A creator marketplace (24 weeks) and a retail operations platform
(32 weeks) we built both sit in this range.</p>

<h3>Complex / scale &mdash; 32 weeks and up</h3>
<p class="small">Multi-sided platforms, heavy integrations, AI features, strict
compliance requirements or high concurrency. Cost here scales with the
integration and reliability surface, not with screen count. An AI ride-hailing
platform we built, with live tracking and fare prediction, took 25 weeks; a
healthcare staffing platform took 26.</p>

<p>&nbsp;</p>
<p class="small muted">Note that the ride-hailing and healthcare examples took
fewer weeks than the retail platform in the tier above. Complexity is not the
same as duration &mdash; a tightly scoped complex product can ship faster than a
sprawling simple one. Which is the entire argument for scoping properly.</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION FOUR</p>
<h2>Choosing the stack without the folklore</h2>
<p>"Wrong technical choice" was one of the three failure modes at the start of
this guide, so it deserves a straight answer. For mobile, the realistic options
are React Native, Flutter, or fully native (Swift and Kotlin, written twice).</p>
<p><b>Performance is no longer the deciding factor.</b> React Native's New
Architecture and Flutter's Impeller renderer have converged on "fast enough that
users cannot tell" for mainstream products &mdash; content, commerce, social,
SaaS, booking, internal tools. The performance problems that actually reach
users are unoptimised lists, oversized images and chatty APIs. Those are
architecture problems, and they bite equally in all three.</p>
<p>What actually decides it:</p>
<p><b>Who you can hire and keep.</b> The most underweighted factor, and in our
experience it decides more projects than every technical comparison combined.
JavaScript and React are the largest talent pool in software, and web engineers
become productive in React Native quickly. Dart is a smaller, separate hiring
market &mdash; fine for a company committed to Flutter, friction for a team that
needs to staff flexibly over five years.</p>
<p><b>How your UI should feel.</b> Flutter draws every pixel itself, so your
design system renders identically on every device &mdash; the right call when
brand-exact rendering is the point. React Native composes real platform
components, so the app feels native on each OS by default. Pick the one that
matches what your product is actually trying to be.</p>
<p><b>Your five hairiest integrations.</b> List them &mdash; the payment
provider, the analytics suite, the industry-specific hardware &mdash; then
search each ecosystem for maintained packages before you decide. Twenty minutes
of checking beats any opinion piece, this one included.</p>
<p><b>When to go fully native.</b> If the product's success genuinely depends on
sustained heavy custom animation, deep platform integration, or a benchmark
margin, write native. Otherwise you are paying for two codebases, two teams and
two release trains to solve a problem you do not have.</p>
<p class="small muted">One caveat worth budgeting for: cross-platform reduces
native code, it does not abolish it. Expect some Swift or Kotlin work in any of
these paths. For transparency &mdash; we build in React Native, largely for the
hiring and maintenance reasons above. That is a preference, not a universal
answer, and the framework above is how you should test it.</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION FIVE</p>
<h2>How to think about budget</h2>
<p>Any guide that hands you a single number for "an app" is guessing. Cost
follows the engineering effort in the tiers above, and effort follows the
answers to the five questions in section one &mdash; particularly question
three.</p>
<p>As a starting frame: a focused MVP typically begins in the low five figures
(USD), and full products scale from there with feature depth. That is a
starting point for a conversation, not a quote.</p>
<p><b>The costs founders most often forget:</b></p>
<ul>
<li>App store developer accounts and the submission cycle</li>
<li>Third-party services that bill per user or per transaction</li>
<li>Hosting and infrastructure, which grow with usage</li>
<li>Maintenance and OS-version updates after launch</li>
<li>The second round of design once real users arrive</li>
</ul>
<p>For a tailored range against your own scope, the calculator on our site takes
about two minutes and is more useful than any blanket figure.</p>
<p class="small muted">soniconsultancyservices.com/app-cost-calculator</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION SIX</p>
<h2>How we scope a project</h2>
<p>This is our own process, included so you know what a scoping conversation
should feel like &mdash; and so you can hold any team, including us, to it.</p>
<h3>1. Scope call &mdash; 30 minutes</h3>
<p class="small">Your goals, users and constraints, with an honest read on
feasibility. If the idea has a serious problem, this is where you should hear
it, not three months in.</p>
<h3>2. Fixed-price proposal &mdash; within 48 hours</h3>
<p class="small">Scope, timeline and a fixed price. No vague day-rates that
leave the final number open.</p>
<h3>3. Build &mdash; weekly demos</h3>
<p class="small">Working software you can hold in your hand from the first
sprint, not a status report describing it.</p>
<h3>4. Launch and support</h3>
<p class="small">Store submission handled, then monitoring and iteration once
real usage starts.</p>

<p>&nbsp;</p>
<p class="eyebrow">SECTION SEVEN</p>
<h2>Judging a proposal</h2>
<p>Once you have quotes in hand, these are the signals that matter more than the
number at the bottom.</p>
<p><b>Worth trusting:</b></p>
<ul>
<li>They pushed back on part of your scope, and explained why</li>
<li>The proposal separates version one from later phases explicitly</li>
<li>Assumptions are written down, so you can see what the price depends on</li>
<li>Post-launch support is priced, not left vague</li>
<li>You will have direct access to the people writing the code</li>
</ul>
<p><b>Worth worrying about:</b></p>
<ul>
<li>Every feature you mentioned was agreed to without question</li>
<li>The estimate arrived without anyone asking about your back end</li>
<li>The price is dramatically below every other quote you have</li>
<li>You cannot tell who is actually going to build it</li>
<li>"We'll figure that out during development" appears more than once</li>
</ul>
<p class="small muted">A team that tells you your scope is too big for your
budget is doing you a favour. It is cheaper to hear it now than in month four.</p>

<p>&nbsp;</p>
<p class="eyebrow">CHECKLIST</p>
<h2>Before you send a single enquiry</h2>
<p>You are ready to talk to any build team when you can answer these without
hedging:</p>
<ul>
<li>The one thing the product must do to be worth launching</li>
<li>Who the first user is, and what they do instead today</li>
<li>What has to be true on the back end &mdash; systems, data, real-time needs</li>
<li>Which of date, budget or scope is genuinely fixed</li>
<li>Who owns the product, and the budget, after launch</li>
<li>Your Core / Supporting / Later split, written down</li>
<li>Which tier your product realistically sits in</li>
</ul>
<p>If several of these are still blank, that is useful information &mdash; it
tells you exactly what to work out before you start paying for engineering
time.</p>
"""

    body = render_story(html)
    doc.insert_pdf(body)
    body.close()

    # header / footer rules on every page after the cover
    for i in range(1, doc.page_count):
        draw_frame(doc[i])

    draw_closing_page(doc)

    doc.set_metadata({
        "title": "App Scoping Guide — Soni Consultancy Services",
        "author": "Soni Consultancy Services",
        "subject": "How to scope a mobile or web app build before you commit budget",
        "keywords": "app scoping, MVP, React Native, MERN, app development, product scope",
        "creator": "Soni Consultancy Services",
    })
    return doc


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "app-scoping-guide.pdf"
    d = build()
    d.save(out, deflate=True, garbage=4)
    print(f"wrote {out} — {d.page_count} pages")
