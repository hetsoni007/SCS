#!/usr/bin/env python3
"""Soni Consultancy Services — Instagram carousel generator.
Renders brand-matched slides (HTML -> PNG via headless Chrome) for a blog post.
Reusable across posts: add an entry to POSTS and run `python3 social-kit/gen.py <slug>`.
"""
import os, sys, subprocess, time, shutil
import segno

ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))  # repo root
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT = "file://" + ROOT + "/assets/fonts/inter-latin.woff2"
HANDLE = "@soni.consultancyservices"

EMBLEM = ('<svg viewBox="0 0 100 100" class="mark"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
 '<stop offset="0" stop-color="#F2DA8C"/><stop offset=".5" stop-color="#C9A24B"/><stop offset="1" stop-color="#9A7B2E"/>'
 '</linearGradient></defs><g fill="none" stroke="url(#g)" stroke-width="2.3" stroke-linejoin="round">'
 '<path d="M24 13H13V24M87 13H76M87 13V24M24 87H13V76M76 87H87V76"/><circle cx="50" cy="48" r="27"/></g>'
 '<circle cx="59" cy="37" r="5.4" fill="url(#g)"/><g stroke="url(#g)" stroke-width="2.5" stroke-linecap="round">'
 '<line x1="38" y1="63" x2="38" y2="49"/><line x1="43" y1="63" x2="43" y2="43"/><line x1="48" y1="63" x2="48" y2="36"/>'
 '<line x1="53" y1="63" x2="53" y2="46"/><line x1="58" y1="63" x2="58" y2="53"/></g>'
 '<g stroke="url(#g)" stroke-width="2" stroke-linecap="round"><line x1="40" y1="68" x2="64" y2="68"/>'
 '<line x1="44" y1="72" x2="61" y2="72"/></g></svg>')

def css(w, h, pad):
    return f"""
@font-face{{font-family:Inter;src:url('{FONT}') format('woff2');font-weight:100 900;font-display:block}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px}}
.slide{{width:{w}px;height:{h}px;position:relative;overflow:hidden;padding:{pad}px;display:flex;flex-direction:column;
 font-family:Inter,-apple-system,Arial;color:#F4F1EA;-webkit-font-smoothing:antialiased;
 background:radial-gradient(120% 85% at 10% 4%,rgba(201,162,75,.22),transparent 52%),
  radial-gradient(90% 70% at 108% 106%,rgba(201,162,75,.10),transparent 55%),#07070a}}
.slide::before{{content:"";position:absolute;inset:0;pointer-events:none;
 background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);
 background-size:64px 64px;mask:radial-gradient(120% 100% at 50% 40%,#000,transparent 90%)}}
.slide>*{{position:relative;z-index:1}}
.top{{display:flex;align-items:center;justify-content:space-between}}
.brandrow{{display:flex;align-items:center;gap:15px}}
.mark{{width:52px;height:52px}}
.bn{{font-weight:800;letter-spacing:.13em;font-size:23px;line-height:1}}
.bn small{{display:block;font-weight:600;letter-spacing:.34em;font-size:11.5px;color:#8f8a82;margin-top:5px}}
.eyebrow{{display:inline-flex;align-items:center;gap:11px;font-size:19px;font-weight:600;letter-spacing:.12em;
 text-transform:uppercase;color:#E7C97A}}
.eyebrow .dot{{width:9px;height:9px;border-radius:50%;background:#C9A24B;box-shadow:0 0 16px #C9A24B}}
.mid{{flex:1;display:flex;flex-direction:column;justify-content:center}}
.gold{{background:linear-gradient(118deg,#F6E0A0,#C9A24B 58%,#9A7B2E);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}}
.h{{font-weight:800;letter-spacing:-.022em;line-height:1.03;font-size:104px}}
.h.m{{font-size:82px}} .h.s{{font-size:64px;line-height:1.06}}
.sub{{color:#B9B2A8;font-size:35px;line-height:1.45;font-weight:400;margin-top:30px}}
.sub b{{color:#F4F1EA;font-weight:600}}
.tag{{display:inline-block;font-size:22px;font-weight:600;letter-spacing:.02em;color:#E7C97A;border:1.5px solid rgba(201,162,75,.5);
 border-radius:999px;padding:11px 24px;margin-bottom:26px}}
.best{{margin-top:34px;font-size:28px;color:#9a948b;line-height:1.5}}
.best b{{color:#F4F1EA;font-weight:600}}
.kv{{display:flex;gap:20px;align-items:baseline;margin-top:14px}}
.kv .n{{font-weight:800;font-size:78px;line-height:1}}
.foot{{display:flex;align-items:center;justify-content:space-between;font-size:22px;color:#8f8a82;letter-spacing:.02em}}
.foot .h2n{{color:#C9A24B;font-weight:600}}
.swipe{{display:inline-flex;align-items:center;gap:12px;font-weight:600;color:#E7C97A}}
.bignum{{position:absolute;right:60px;top:40px;font-size:300px;font-weight:800;color:rgba(201,162,75,.05);z-index:0;line-height:1}}
.card{{background:#fff;border-radius:26px;padding:30px;display:inline-flex;box-shadow:0 24px 60px rgba(0,0,0,.4)}}
.card svg{{width:300px;height:300px;display:block}}
.qrow{{display:flex;align-items:center;gap:44px;margin-top:20px}}
.pill{{display:inline-block;background:linear-gradient(118deg,#F6E0A0,#C9A24B);color:#1a1406;font-weight:700;font-size:30px;
 padding:20px 40px;border-radius:999px}}
"""

def brand(small=True):
    sm = '<small>CONSULTANCY SERVICES</small>' if small else ''
    return f'<div class="brandrow">{EMBLEM}<div class="bn">SONI{sm}</div></div>'

def frame(inner, w=1080, h=1350, pad=96):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{css(w,h,pad)}</style></head>'
            f'<body><div class="slide">{inner}</div></body></html>')

def foot(right_html):
    return f'<div class="foot"><span>{HANDLE}</span>{right_html}</div>'

def qr_svg(url):
    q = segno.make(url, error='m')
    # omitsize -> viewBox instead of fixed px, so CSS can scale the drawing
    return q.svg_inline(dark="#0b0b0d", light="#ffffff", border=1, omitsize=True)

def render(html_str, out_png, w, h):
    """Screenshot HTML at exact size. Chrome sometimes writes the PNG then hangs on
    exit, so poll for a stable file and kill the process instead of trusting it."""
    tmp = out_png + ".html"
    prof = out_png + ".prof"
    open(tmp, "w", encoding="utf-8").write(html_str)
    if os.path.exists(out_png):
        os.remove(out_png)
    proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--window-size={w},{h}", "--virtual-time-budget=2500",
                    f"--screenshot={out_png}", f"--user-data-dir={prof}",
                    "file://" + os.path.abspath(tmp)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 40
    stable, last = 0, -1
    while time.time() < deadline:
        if os.path.exists(out_png):
            sz = os.path.getsize(out_png)
            stable = stable + 1 if (sz == last and sz > 5000) else 0
            last = sz
            if stable >= 3:
                break
        if proc.poll() is not None and os.path.exists(out_png):
            break
        time.sleep(0.2)
    if proc.poll() is None:
        proc.kill(); proc.wait()
    os.remove(tmp)
    shutil.rmtree(prof, ignore_errors=True)
    if not os.path.exists(out_png):
        raise RuntimeError("render failed: " + out_png)

# ---------------- POST DEFINITIONS ----------------
def slides_native(url):
    S = []
    # 1 cover
    S.append(('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>Decision guide</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">Mobile · 2026</div>'
      '<div class="h">Native <span class="gold">or</span><br>Cross-Platform?</div>'
      '<div class="sub">How to choose your app’s foundation in 2026 — <b>without overspending.</b></div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 2 problem
    S.append(('<div class="top">'+brand()+'<span class="bignum">01</span></div>'
      '<div class="mid"><div class="h m">Pick wrong,<br>and you can <span class="gold">double</span><br>your budget.</div>'
      '<div class="sub">Native vs cross-platform is the first big fork in every app project — and the costliest to get wrong. Here’s how to actually decide.</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 3 RN
    S.append(('<div class="top">'+brand()+'<span class="bignum">02</span></div>'
      '<div class="mid"><span class="tag">Cross-platform · JavaScript</span>'
      '<div class="h m gold">React Native</div>'
      '<div class="sub">Fastest, most cost-effective. <b>One codebase → iOS + Android</b> (and shared web logic).</div>'
      '<div class="best"><b>Best for:</b> most apps, React/JS teams, MVPs and speed to market.</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 4 Flutter
    S.append(('<div class="top">'+brand()+'<span class="bignum">03</span></div>'
      '<div class="mid"><span class="tag">Cross-platform · Dart</span>'
      '<div class="h m gold">Flutter</div>'
      '<div class="sub">Pixel-perfect, fully custom UI from a <b>single codebase.</b></div>'
      '<div class="best"><b>Best for:</b> design-led, animation-heavy, brand-driven interfaces.</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 5 Native
    S.append(('<div class="top">'+brand()+'<span class="bignum">04</span></div>'
      '<div class="mid"><span class="tag">Swift &amp; Kotlin</span>'
      '<div class="h m gold">Native</div>'
      '<div class="sub">Maximum performance &amp; hardware access — at <b>~2× the cost</b> (two codebases).</div>'
      '<div class="best"><b>Best for:</b> AR, advanced camera/BLE, high-end games, single-platform apps.</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 6 rule
    S.append(('<div class="top">'+brand()+'<span class="bignum">05</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">The rule of thumb</div>'
      '<div class="h s">Start <span class="gold">cross-platform.</span> Go native only when a real requirement forces it.</div>'
      '<div class="sub">Defaulting to native “to be safe” is the #1 way founders overspend.</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>')))
    # 7 CTA + QR
    S.append(('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>Your move</span></div>'
      '<div class="mid"><div class="h s">Still unsure?<br>Take the <span class="gold">30-second</span> decision tool.</div>'
      '<div class="qrow"><div class="card">'+qr_svg(url)+'</div>'
      '<div><div class="pill">Link in bio &#8594;</div>'
      '<div class="sub" style="margin-top:22px;font-size:30px">Scan, or tap the link<br>in our bio to try it free.</div></div></div></div>'
      +foot('<span class="h2n">soniconsultancyservices.com</span>')))
    return S

def story_native(url):
    return ('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>New post</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">Mobile · 2026</div>'
      '<div class="h m">Native <span class="gold">or</span><br>Cross-Platform?</div>'
      '<div class="sub">Answer 5 quick questions and get a recommendation for <b>your</b> app — free, 30 seconds.</div>'
      '<div style="margin-top:60px;text-align:center"><div class="pill">Tap the link &#8593;</div>'
      '<div class="sub" style="margin-top:24px;font-size:28px;text-align:center">(link sticker goes here)</div></div></div>'
      +foot('<span class="h2n">Interactive decision tool</span>'))

def _cover(eyebrow_r, cat, h_html, sub_html):
    return ('<div class="top">'+brand()+f'<span class="eyebrow"><span class="dot"></span>{eyebrow_r}</span></div>'
      f'<div class="mid"><div class="eyebrow" style="margin-bottom:26px">{cat}</div>'
      f'<div class="h m">{h_html}</div>'
      f'<div class="sub">{sub_html}</div></div>'
      +foot('<span class="swipe">Swipe &#8594;</span>'))

def _body(num, inner):
    return ('<div class="top">'+brand()+f'<span class="bignum">{num}</span></div>'
      f'<div class="mid">{inner}</div>'+foot('<span class="swipe">Swipe &#8594;</span>'))

def _qr_cta(h_html, pill, subline, url):
    return ('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>Your move</span></div>'
      f'<div class="mid"><div class="h s">{h_html}</div>'
      '<div class="qrow"><div class="card">'+qr_svg(url)+'</div>'
      f'<div><div class="pill">{pill}</div>'
      f'<div class="sub" style="margin-top:22px;font-size:30px">{subline}</div></div></div></div>'
      +foot('<span class="h2n">soniconsultancyservices.com</span>'))

def slides_stack(url):
    return [
      _cover("Interactive picker","MVP · 2026",
        'Which <span class="gold">stack</span><br>should your MVP use?',
        'Frontend, backend, database, hosting — answer 5 questions and <b>get all four layers.</b>'),
      _body("01",'<div class="h m">The wrong stack<br><span class="gold">taxes every sprint.</span></div>'
        '<div class="sub">Exotic tooling, unhireable skills, infra for scale you don’t have. The right stack is mostly about your product’s <b>shape</b> — not fashion.</div>'),
      _body("02",'<span class="tag">Mobile-first default</span><div class="h m gold">React Native + MERN</div>'
        '<div class="sub">One language everywhere, one codebase for both stores, a backend <b>you control.</b></div>'
        '<div class="best"><b>Best for:</b> mobile products with real business logic. Our default.</div>'),
      _body("03",'<span class="tag">Web-first SaaS</span><div class="h m gold">Next.js + Postgres</div>'
        '<div class="sub">App + marketing site in one framework, relational data done <b>properly from day one.</b></div>'
        '<div class="best"><b>Best for:</b> dashboards, B2B workflows, browser tools.</div>'),
      _body("04",'<span class="tag">Two more plays</span><div class="h s"><span class="gold">RN + Firebase</span> — validate in weeks, no server.<br><br><span class="gold">AI-first</span> — a Node AI layer between app and models.</div>'
        '<div class="best"><b>Best for:</b> speed-to-signal · AI-core products.</div>'),
      _body("05",'<div class="eyebrow" style="margin-bottom:26px">The rule</div>'
        '<div class="h s">Pick <span class="gold">boring tech</span> for everything that isn’t your differentiator.</div>'
        '<div class="sub">Users don’t care what database you run. Spend innovation where they <b>can feel it.</b></div>'),
      _qr_cta('Get your stack in <span class="gold">30 seconds.</span>',"Link in bio &#8594;","Scan, or tap the link<br>in our bio — free.",url),
    ]

def story_stack(url):
    return ('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>New post</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">MVP · 2026</div>'
      '<div class="h m">Which <span class="gold">stack</span><br>should your MVP use?</div>'
      '<div class="sub">Answer 5 questions — get frontend, backend, database and hosting for <b>your</b> product.</div>'
      '<div style="margin-top:60px;text-align:center"><div class="pill">Tap the link &#8593;</div>'
      '<div class="sub" style="margin-top:24px;font-size:28px;text-align:center">(link sticker goes here)</div></div></div>'
      +foot('<span class="h2n">Interactive stack picker</span>'))

def slides_security(url):
    return [
      _cover("Self-audit · 2 min","Mobile · Security",
        'Is your app<br><span class="gold">actually secure?</span>',
        'Score your app across <b>10 controls</b> — and see exactly where to harden first.'),
      _body("01",'<div class="h m">Most breaches<br>aren’t <span class="gold">clever.</span></div>'
        '<div class="sub">A token in plain storage. A key in the bundle. An API that trusts the client. <b>Basics not done</b> — which means basics can fix it.</div>'),
      _body("02",'<span class="tag">On the device</span><div class="h s">Tokens in <span class="gold">Keychain / Keystore.</span><br>No secrets in the bundle.</div>'
        '<div class="sub">Anything shipped in the binary <b>can be extracted.</b> Assume the phone is hostile.</div>'),
      _body("03",'<span class="tag">On the server</span><div class="h s">Authorize <span class="gold">every endpoint.</span><br>Validate every input.</div>'
        '<div class="sub">Not just “is this user logged in” — <b>may this user touch this resource?</b> The server is the only layer you fully control.</div>'),
      _body("04",'<span class="tag">In the pipeline</span><div class="h s">Scan dependencies <span class="gold">in CI.</span></div>'
        '<div class="sub">Known CVEs in stale libraries are the most <b>preventable</b> compromise vector. A leaked key should fail the build, not reach the stores.</div>'),
      _body("05",'<div class="eyebrow" style="margin-bottom:26px">Your score</div>'
        '<div class="h s"><span class="gold">80+</span> solid foundation.<br><span class="gold">50–79</span> close the gaps.<br><span class="gold">&lt;50</span> fix it this sprint.</div>'
        '<div class="sub">Most fixes take <b>days, not months.</b></div>'),
      _qr_cta('Score your app in <span class="gold">2 minutes.</span>',"Link in bio &#8594;","Scan, or tap the link<br>in our bio — free, private.",url),
    ]

def story_security(url):
    return ('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>New post</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">Mobile · Security</div>'
      '<div class="h m">Is your app<br><span class="gold">actually secure?</span></div>'
      '<div class="sub">10 controls, a live score, and the fixes that matter first. <b>2 minutes, free.</b></div>'
      '<div style="margin-top:60px;text-align:center"><div class="pill">Tap the link &#8593;</div>'
      '<div class="sub" style="margin-top:24px;font-size:28px;text-align:center">(link sticker goes here)</div></div></div>'
      +foot('<span class="h2n">Security self-audit</span>'))

def slides_monetization(url):
    return [
      _cover("Revenue explorer","Strategy · 2026",
        'How will your app<br><span class="gold">make money?</span>',
        '“We’ll figure it out later” isn’t a model. Drag the sliders, <b>see the math.</b>'),
      _body("01",'<div class="h m">Four models cover<br><span class="gold">almost every app.</span></div>'
        '<div class="sub"><b>Subscription</b> · recurring value.<br><b>Freemium + IAP</b> · free core, paid depth.<br><b>Ads</b> · attention at scale.<br><b>Commission</b> · a cut of transactions.</div>'),
      _body("02",'<span class="tag">Subscription &amp; IAP</span><div class="h s">Depth and retention<br><span class="gold">beat raw reach.</span></div>'
        '<div class="sub">A modest, engaged audience on a subscription usually out-earns a big casual one. The battle is <b>churn</b>, not trials.</div>'),
      _body("03",'<span class="tag">Advertising</span><div class="h s">Ads ≈ impressions <span class="gold">× eCPM.</span></div>'
        '<div class="sub">The math is honest: without big, frequent usage, ads earn <b>pocket change.</b> Niche and B2B apps should usually skip them.</div>'),
      _body("04",'<span class="tag">Commission</span><div class="h s">Take a cut of the <span class="gold">value you enable.</span></div>'
        '<div class="sub">Rides, bookings, orders — revenue scales with <b>transaction volume</b>, not user count. Prerequisite: liquidity.</div>'),
      _body("05",'<div class="eyebrow" style="margin-bottom:26px">The rules</div>'
        '<div class="h s">Follow the <span class="gold">usage shape.</span><br>Prove <span class="gold">one model</span> first.<br>Price from <span class="gold">value.</span></div>'
        '<div class="sub">And model the store cut <b>before</b> you set prices.</div>'),
      _qr_cta('Run <span class="gold">your numbers</span> in the explorer.',"Link in bio &#8594;","Scan, or tap the link<br>in our bio — free.",url),
    ]

def story_monetization(url):
    return ('<div class="top">'+brand()+'<span class="eyebrow"><span class="dot"></span>New post</span></div>'
      '<div class="mid"><div class="eyebrow" style="margin-bottom:26px">Strategy · Revenue</div>'
      '<div class="h m">How will your app<br><span class="gold">make money?</span></div>'
      '<div class="sub">Pick a model, drag the sliders to your assumptions, and <b>see the monthly math.</b></div>'
      '<div style="margin-top:60px;text-align:center"><div class="pill">Tap the link &#8593;</div>'
      '<div class="sub" style="margin-top:24px;font-size:28px;text-align:center">(link sticker goes here)</div></div></div>'
      +foot('<span class="h2n">Interactive revenue explorer</span>'))

POSTS = {
  "native-vs-cross-platform-2026": {
     "url": "https://soniconsultancyservices.com/blog/native-vs-cross-platform-2026",
     "slides": slides_native, "story": story_native },
  "mvp-tech-stack-2026": {
     "url": "https://soniconsultancyservices.com/blog/mvp-tech-stack-2026",
     "slides": slides_stack, "story": story_stack },
  "mobile-app-security-checklist": {
     "url": "https://soniconsultancyservices.com/blog/mobile-app-security-checklist",
     "slides": slides_security, "story": story_security },
  "app-monetization-models": {
     "url": "https://soniconsultancyservices.com/blog/app-monetization-models",
     "slides": slides_monetization, "story": story_monetization },
}

def build(slug):
    p = POSTS[slug]; url = p["url"]
    outdir = os.path.join(ROOT, "social-kit", slug); os.makedirs(outdir, exist_ok=True)
    slides = p["slides"](url)
    for idx, inner in enumerate(slides, 1):
        out = os.path.join(outdir, f"slide-{idx:02d}.png")
        render(frame(inner, 1080, 1350, 96), out, 1080, 1350)
        print("  rendered", os.path.basename(out))
    story = p["story"](url)
    out = os.path.join(outdir, "story.png")
    render(frame(story, 1080, 1920, 96), out, 1080, 1920)
    print("  rendered story.png")
    print("DONE:", outdir, "(%d slides + story)" % len(slides))

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "native-vs-cross-platform-2026"
    build(slug)
