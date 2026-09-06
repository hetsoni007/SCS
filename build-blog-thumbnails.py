#!/usr/bin/env python3
"""
Generate topical illustration thumbnails for every blog post.

Design rules (keeps 31 thumbnails looking like one family):
  - viewBox 0 0 400 150, fills the whole .blog-thumb box
  - structure drawn in var(--line2); body shapes in var(--glass3)
  - exactly ONE gold focal element per scene (var(--gold))
  - no text — these must read at card size and in both themes
"""
import json, re, sys


# ---------- primitives ----------

def wash():
    """No-op: the gold wash is a CSS background on .blog-thumb.

    Inlining it per-SVG would put 31 elements with id="g" on the blog index,
    which is invalid HTML and lets the browser resolve url(#g) to the wrong one.
    """
    return ""


def phone(x, y, w=44, h=78, gold=False, screen=""):
    st = "var(--gold)" if gold else "var(--line2)"
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>'
        f'<rect x="{x + w/2 - 6}" y="{y + 4}" width="12" height="2.6" rx="1.3" fill="{st}" opacity=".7"/>'
        f'{screen}'
    )


def win(x, y, w=110, h=78, gold=False):
    st = "var(--gold)" if gold else "var(--line2)"
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>'
        f'<path d="M{x} {y+16}h{w}" stroke="{st}" stroke-width="1.3" opacity=".75"/>'
        f'<circle cx="{x+11}" cy="{y+8}" r="2.2" fill="{st}" opacity=".8"/>'
        f'<circle cx="{x+19}" cy="{y+8}" r="2.2" fill="{st}" opacity=".55"/>'
        f'<circle cx="{x+27}" cy="{y+8}" r="2.2" fill="{st}" opacity=".4"/>'
    )


def lines(x, y, widths, gap=9, gold_idx=-1):
    out = []
    for i, w in enumerate(widths):
        c = "var(--gold)" if i == gold_idx else "var(--line2)"
        op = "1" if i == gold_idx else ".6"
        out.append(f'<rect x="{x}" y="{y + i*gap}" width="{w}" height="4" rx="2" fill="{c}" opacity="{op}"/>')
    return "".join(out)


def bars(x, y, heights, bw=13, gap=7, gold_idx=-1):
    out = []
    for i, h in enumerate(heights):
        c = "var(--gold)" if i == gold_idx else "var(--line2)"
        op = "1" if i == gold_idx else ".55"
        out.append(f'<rect x="{x + i*(bw+gap)}" y="{y-h}" width="{bw}" height="{h}" rx="3" fill="{c}" opacity="{op}"/>')
    return "".join(out)


def node(cx, cy, r=15, gold=False, inner=""):
    st = "var(--gold)" if gold else "var(--line2)"
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>{inner}')


def link(x1, y1, x2, y2, gold=False, dash=False):
    st = "var(--gold)" if gold else "var(--line2)"
    d = ' stroke-dasharray="4 4"' if dash else ""
    op = "1" if gold else ".55"
    return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{st}" stroke-width="1.6" opacity="{op}"{d}/>'


def shield(cx, cy, s=1.0, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    w, h = 34*s, 42*s
    return (
        f'<path d="M{cx} {cy-h/2}l{w/2} {h*0.18}v{h*0.34}c0 {h*0.28}-{w*0.28} {h*0.4}-{w/2} {h*0.48}'
        f'c-{w*0.22}-{h*0.08}-{w/2}-{h*0.2}-{w/2}-{h*0.48}v-{h*0.34}z" '
        f'fill="var(--glass3)" stroke="{st}" stroke-width="1.7"/>'
    )


def spark(cx, cy, s=1.0, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    a, b = 9*s, 3.4*s
    return (f'<path d="M{cx} {cy-a}q{b} {a-b} {a} {b}q-{a-b} {b} -{a} {a}q-{b}-{a-b} -{a}-{b}q{a-b}-{b} {a}-{a}z" fill="{st}"/>')


def cloud(cx, cy, s=1.0, gold=False):
    st = "var(--gold)" if gold else "var(--line2)"
    w = 62*s
    return (
        f'<path d="M{cx-w/2} {cy+9}h{w}a{13*s} {13*s} 0 0 0 -{9*s}-{20*s}a{17*s} {17*s} 0 0 0 -{32*s} -{2*s}'
        f'a{12*s} {12*s} 0 0 0 -{4*s} {22*s}z" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>'
    )


def check(cx, cy, s=1.0, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    return (f'<circle cx="{cx}" cy="{cy}" r="{10*s}" fill="none" stroke="{st}" stroke-width="1.7"/>'
            f'<path d="M{cx-4.6*s} {cy}l{3.2*s} {3.4*s} {6.2*s}-{7*s}" fill="none" stroke="{st}" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')


def gauge(cx, cy, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    return (
        f'<path d="M{cx-38} {cy}a38 38 0 0 1 76 0" fill="none" stroke="var(--line2)" stroke-width="5" stroke-linecap="round" opacity=".5"/>'
        f'<path d="M{cx-38} {cy}a38 38 0 0 1 54 -36" fill="none" stroke="{st}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M{cx} {cy}l20-16" stroke="{st}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="{cx}" cy="{cy}" r="4" fill="{st}"/>'
    )


def coins(x, y, n=3, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    out = []
    for i in range(n):
        yy = y - i*9
        out.append(f'<ellipse cx="{x}" cy="{yy}" rx="19" ry="6.5" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>')
    return "".join(out)


def doc(x, y, w=58, h=74, gold=False):
    st = "var(--gold)" if gold else "var(--line2)"
    f = 15
    return (
        f'<path d="M{x} {y}h{w-f}l{f} {f}v{h-f}a0 0 0 0 1 0 0H{x}z" fill="var(--glass3)" stroke="{st}" stroke-width="1.6"/>'
        f'<path d="M{x+w-f} {y}v{f}h{f}" fill="none" stroke="{st}" stroke-width="1.6"/>'
    )


def arrow(x1, y, x2, gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    return (f'<path d="M{x1} {y}H{x2}" stroke="{st}" stroke-width="1.8" stroke-linecap="round"/>'
            f'<path d="M{x2-7} {y-5}l7 5-7 5" fill="none" stroke="{st}" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')


def curve(gold=True):
    st = "var(--gold)" if gold else "var(--line2)"
    return (f'<path d="M40 118C110 118 150 100 190 76S280 30 350 26" fill="none" stroke="{st}" '
            f'stroke-width="2.4" stroke-linecap="round"/>')


def grid_mini(x, y, cols=3, rows=2, cell=20, gap=6, gold_idx=1):
    out = []
    i = 0
    for r in range(rows):
        for c in range(cols):
            g = (i == gold_idx)
            st = "var(--gold)" if g else "var(--line2)"
            out.append(f'<rect x="{x + c*(cell+gap)}" y="{y + r*(cell+gap)}" width="{cell}" height="{cell}" '
                       f'rx="5" fill="var(--glass3)" stroke="{st}" stroke-width="1.5" opacity="{1 if g else .7}"/>')
            i += 1
    return "".join(out)


def wrap(body):
    return ('<svg class="bthumb" viewBox="0 0 400 150" fill="none" aria-hidden="true" '
            'preserveAspectRatio="xMidYMid meet">' + wash() + body + '</svg>')


# ---------- scenes ----------

S = {}

S["wordpress-website-cost-india"] = wrap(
    win(48, 36) + lines(62, 66, [70, 54, 62], gold_idx=0) + coins(285, 104) +
    arrow(178, 75, 246)
)

S["wordpress-vs-custom-website"] = wrap(
    win(40, 36, 130, 78) + lines(54, 68, [88, 66, 74]) +
    win(230, 36, 130, 78, gold=True) + lines(244, 68, [88, 70, 58], gold_idx=1) +
    f'<circle cx="200" cy="75" r="15" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.6"/>'
    f'<path d="M194 69l12 12M206 69l-12 12" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round"/>'
)

S["woocommerce-payment-gateway-india"] = wrap(
    '<rect x="46" y="42" width="122" height="72" rx="9" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<path d="M46 64h122" stroke="var(--gold)" stroke-width="1.5"/>'
    '<rect x="58" y="88" width="34" height="6" rx="3" fill="var(--gold)" opacity=".85"/>'
    + grid_mini(232, 48, cols=1, rows=3, cell=26, gap=10, gold_idx=0)
    + arrow(184, 78, 218)
)

S["wordpress-seo-speed-checklist"] = wrap(gauge(200, 106))

S["react-native-new-architecture-2026"] = wrap(
    phone(54, 24, 56, 92) +
    '<path d="M110 46C150 18 188 18 224 44" fill="none" stroke="var(--line2)" stroke-width="1.6" stroke-dasharray="5 6" opacity=".5"/>'
    '<path d="M158 24l12 12M170 24l-12 12" stroke="var(--line2)" stroke-width="2" stroke-linecap="round" opacity=".55"/>'
    '<path d="M110 88H228" stroke="var(--gold)" stroke-width="2.2"/>'
    + node(169, 88, 10, gold=True)
    + '<rect x="228" y="54" width="66" height="66" rx="11" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + spark(261, 87, 1.05)
)

S["rbi-fintech-app-compliance-india"] = wrap(
    shield(110, 75, 1.55, gold=True)
    + check(224, 40, .8, gold=False) + lines(244, 36, [76])
    + check(224, 75, .8, gold=False) + lines(244, 71, [60])
    + check(224, 110, .8, gold=False) + lines(244, 106, [68])
)

S["react-native-push-notifications"] = wrap(
    node(70, 40, 15) + node(70, 108, 15)
    + link(85, 44, 148, 60, dash=True) + link(85, 104, 148, 88, dash=True)
    + phone(160, 26, 58, 96, gold=True)
    + '<path d="M178 26q11-11 22 0" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-linecap="round" opacity=".65"/>'
    '<path d="M170 26q19-19 38 0" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>'
)

S["native-vs-cross-platform-2026"] = wrap(
    node(78, 75, 19, gold=True) +
    link(97, 75, 150, 48, gold=True) + link(97, 75, 150, 102, gold=True) +
    phone(150, 20, 52, 56) + phone(150, 84, 52, 56) +
    phone(268, 36, 62, 78)
)

S["mvp-tech-stack-2026"] = wrap(
    ''.join(
        f'<rect x="{120 + i*8}" y="{36 + i*20}" width="{160 - i*16}" height="16" rx="5" '
        f'fill="var(--glass3)" stroke="{"var(--gold)" if i == 0 else "var(--line2)"}" stroke-width="1.6"/>'
        for i in range(4)
    )
)

S["mobile-app-security-checklist"] = wrap(
    phone(96, 30, 58, 90) + shield(200, 74) +
    lines(248, 52, [64, 50, 58]) + check(258, 104, .85)
)

S["app-monetization-models"] = wrap(
    bars(112, 118, [26, 44, 62, 84], bw=18, gap=12, gold_idx=3) + coins(300, 112)
)

S["how-long-to-build-an-app"] = wrap(
    ''.join(
        f'<rect x="{70 + i*14}" y="{44 + i*22}" width="{86 + i*38}" height="12" rx="6" '
        f'fill="{"var(--gold)" if i == 2 else "var(--line2)"}" opacity="{1 if i == 2 else .5}"/>'
        for i in range(3)
    ) + '<path d="M64 32v92" stroke="var(--line2)" stroke-width="1.5" opacity=".7"/>'
)

S["ci-cd-react-native"] = wrap(
    node(76, 75) + node(160, 75) + node(244, 75) + node(328, 75, gold=True) +
    link(91, 75, 145, 75) + link(175, 75, 229, 75) + link(259, 75, 313, 75, gold=True) +
    check(328, 75, .8)
)

S["validate-app-idea-before-building"] = wrap(
    '<circle cx="176" cy="70" r="34" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.7"/>'
    '<path d="M200 94l26 26" stroke="var(--line2)" stroke-width="2.4" stroke-linecap="round"/>'
    + spark(176, 66, 1.5)
    + lines(252, 56, [58, 44, 50], gold_idx=0)
)

S["app-store-launch-checklist"] = wrap(
    '<path d="M150 112c-16-34 0-62 22-76 22 14 38 42 22 76z" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<circle cx="172" cy="62" r="8" fill="none" stroke="var(--gold)" stroke-width="1.7"/>'
    '<path d="M158 112l-10 16M186 112l10 16" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>'
    + check(258, 56, .8) + check(258, 88, .8) + lines(276, 52, [56]) + lines(276, 84, [44])
)

S["app-maintenance-cost"] = wrap(
    '<path d="M168 58a17 17 0 1 0 22 22l30 30 10-10-30-30a17 17 0 0 0-22-22l12 12-8 8-12-12z" '
    'fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.6"/>'
    + bars(252, 116, [22, 30, 38, 46], bw=13, gap=9, gold_idx=3)
)

S["aws-cloud-migration-guide"] = wrap(
    '<rect x="52" y="52" width="66" height="58" rx="7" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.6"/>'
    + lines(64, 64, [42, 42, 42])
    + arrow(134, 80, 196)
    + cloud(280, 68, 1.25, gold=True)
)

S["bsa-aml-software-build-vs-buy"] = wrap(
    '<path d="M200 34v82M164 116h72" stroke="var(--line2)" stroke-width="1.8" stroke-linecap="round"/>'
    '<path d="M200 46H136M200 46h64" stroke="var(--line2)" stroke-width="1.6"/>'
    '<path d="M118 46l-18 30h36z" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.6"/>'
    '<path d="M282 46l-18 30h36z" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + shield(200, 84, .62)
)

S["react-native-app-development-cost"] = wrap(
    phone(120, 30, 60, 90) +
    '<path d="M240 58h46l30 30-46 46-46-46z" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<circle cx="272" cy="76" r="5" fill="var(--gold)"/>'
)

S["hire-react-native-developers"] = wrap(
    node(132, 62, 17, gold=True) + node(200, 96, 17) + node(268, 62, 17) +
    link(147, 70, 186, 90, gold=True) + link(214, 90, 254, 70) +
    ''.join(f'<path d="M{cx-10} {cy+26}a10 10 0 0 1 20 0" fill="none" stroke="var(--line2)" stroke-width="1.5" opacity=".6"/>'
            for cx, cy in [(132, 62), (200, 96), (268, 62)])
)

S["ai-agent-development-services"] = wrap(
    node(200, 75, 22, gold=True, inner=spark(200, 75, .95)) +
    ''.join(link(200, 75, x, y, dash=True) for x, y in [(112, 40), (112, 110), (288, 40), (288, 110)]) +
    ''.join(node(x, y, 12) for x, y in [(112, 40), (112, 110), (288, 40), (288, 110)])
)

S["ai-app-development-cost-2026"] = wrap(
    '<rect x="128" y="46" width="66" height="66" rx="10" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + spark(161, 79, 1.15)
    + ''.join(f'<path d="M{194} {58 + i*18}h16" stroke="var(--gold)" stroke-width="1.6" opacity=".7"/>' for i in range(3))
    + ''.join(f'<path d="M{112} {58 + i*18}h16" stroke="var(--gold)" stroke-width="1.6" opacity=".7"/>' for i in range(3))
    + bars(244, 116, [26, 40, 56], bw=16, gap=11, gold_idx=2)
)

S["build-vs-buy-ai-cto-framework"] = wrap(
    '<path d="M200 124V86" stroke="var(--line2)" stroke-width="2"/>'
    '<path d="M200 86C200 60 148 62 148 34" fill="none" stroke="var(--line2)" stroke-width="2"/>'
    '<path d="M200 86C200 60 252 62 252 34" fill="none" stroke="var(--gold)" stroke-width="2.2"/>'
    + node(148, 30, 13) + node(252, 30, 13, gold=True)
)

S["react-native-vs-flutter-2026"] = wrap(
    node(132, 75, 30) +
    '<circle cx="132" cy="75" r="9" fill="none" stroke="var(--line2)" stroke-width="1.6"/>'
    '<ellipse cx="132" cy="75" rx="28" ry="11" fill="none" stroke="var(--line2)" stroke-width="1.5" opacity=".7"/>'
    '<ellipse cx="132" cy="75" rx="28" ry="11" fill="none" stroke="var(--line2)" stroke-width="1.5" opacity=".7" transform="rotate(60 132 75)"/>'
    '<ellipse cx="132" cy="75" rx="28" ry="11" fill="none" stroke="var(--line2)" stroke-width="1.5" opacity=".7" transform="rotate(120 132 75)"/>'
    '<path d="M252 46l34 34-18 18-34-34z" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<path d="M268 96l18 18h-34z" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<path d="M200 56v38" stroke="var(--line2)" stroke-width="1.5" stroke-dasharray="4 5" opacity=".7"/>'
)

S["nextjs-saas-architecture"] = wrap(
    '<rect x="150" y="26" width="100" height="24" rx="6" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.6"/>'
    '<rect x="96" y="66" width="88" height="24" rx="6" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.5"/>'
    '<rect x="216" y="66" width="88" height="24" rx="6" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.5"/>'
    '<rect x="150" y="106" width="100" height="24" rx="6" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.5"/>'
    + link(200, 50, 140, 66) + link(200, 50, 260, 66) + link(140, 90, 200, 106) + link(260, 90, 200, 106)
)

S["mvp-to-product-market-fit"] = wrap(
    curve() +
    '<circle cx="190" cy="76" r="6" fill="var(--gold)"/>'
    '<circle cx="350" cy="26" r="7" fill="none" stroke="var(--gold)" stroke-width="2"/>'
    + ''.join(f'<path d="M{60 + i*72} 128v-6" stroke="var(--line2)" stroke-width="1.4" opacity=".6"/>' for i in range(5))
)

S["ai-react-native-app-development"] = wrap(
    phone(168, 26, 64, 98, gold=True) + spark(200, 66, 1.35) +
    lines(180, 92, [40, 30], gap=8) +
    ''.join(link(200, 75, x, y, dash=True) for x, y in [(96, 44), (96, 106), (304, 44), (304, 106)]) +
    ''.join(node(x, y, 9) for x, y in [(96, 44), (96, 106), (304, 44), (304, 106)])
)

S["react-native-chatgpt-integration"] = wrap(
    phone(96, 30, 58, 90) +
    '<rect x="180" y="42" width="112" height="30" rx="12" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.5"/>'
    '<rect x="204" y="84" width="112" height="30" rx="12" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + spark(300, 60, .85)
)

S["on-device-ai-react-native"] = wrap(
    phone(150, 24, 74, 102, gold=True) +
    '<rect x="170" y="56" width="34" height="34" rx="7" fill="none" stroke="var(--gold)" stroke-width="1.7"/>'
    + ''.join(f'<path d="M{170 - 9} {64 + i*11}h9M{204} {64 + i*11}h9" stroke="var(--gold)" stroke-width="1.5" opacity=".75"/>' for i in range(3))
    + cloud(316, 44, .7)
    + '<path d="M292 34l48 24" stroke="var(--line2)" stroke-width="1.8" stroke-linecap="round"/>'
)

S["ai-chatbot-app-react-native"] = wrap(
    '<rect x="104" y="40" width="120" height="34" rx="14" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.5"/>'
    + lines(120, 52, [70, 48], gap=9)
    + '<rect x="176" y="86" width="120" height="34" rx="14" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + spark(292, 74, .9)
)

# ---------- new posts ----------

S["kotlin-multiplatform-vs-react-native"] = wrap(
    '<rect x="146" y="96" width="108" height="26" rx="7" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    + link(178, 96, 130, 60, gold=True) + link(222, 96, 270, 60, gold=True)
    + phone(104, 20, 52, 44) + phone(244, 20, 52, 44)
    + '<path d="M130 64v32M270 64v32" stroke="var(--gold)" stroke-width="1.5" opacity=".5"/>'
)

S["dpdp-act-app-compliance-india"] = wrap(
    doc(104, 32, 62, 82, gold=False) + lines(116, 56, [38, 30, 34]) +
    '<rect x="196" y="66" width="46" height="38" rx="7" fill="var(--glass3)" stroke="var(--gold)" stroke-width="1.7"/>'
    '<path d="M206 66v-9a13 13 0 0 1 26 0v9" fill="none" stroke="var(--gold)" stroke-width="1.7"/>'
    '<circle cx="219" cy="85" r="4" fill="var(--gold)"/>'
    + check(300, 60, .82) + check(300, 96, .82)
)

S["can-ai-build-my-app"] = wrap(
    '<rect x="104" y="46" width="66" height="58" rx="11" fill="var(--glass3)" stroke="var(--line2)" stroke-width="1.6"/>'
    '<circle cx="124" cy="72" r="4.5" fill="var(--line2)"/><circle cx="150" cy="72" r="4.5" fill="var(--line2)"/>'
    '<path d="M124 90h26" stroke="var(--line2)" stroke-width="1.7" stroke-linecap="round"/>'
    '<path d="M137 46V32" stroke="var(--line2)" stroke-width="1.5"/><circle cx="137" cy="28" r="4" fill="var(--line2)"/>'
    + arrow(184, 75, 224)
    + ''.join(
        '<rect x="242" y="%d" width="%d" height="15" rx="4" fill="var(--glass3)" stroke="%s" '
        'stroke-width="1.5"%s/>' % (
            40 + i*24, 74 - i*14,
            "var(--gold)" if i < 2 else "var(--line2)",
            "" if i < 2 else ' stroke-dasharray="4 4"',
        )
        for i in range(3)
    )
)

S["super-app-development"] = wrap(
    phone(150, 18, 100, 114, gold=True) +
    grid_mini(166, 44, cols=3, rows=3, cell=20, gap=6, gold_idx=4)
)


# ---------- fit each viewBox to its measured content ----------
# Scenes were composed on a loose 400x150 canvas, so most content filled only a
# fraction of it and rendered tiny under preserveAspectRatio="meet". These bboxes
# were measured in-browser with getBBox(); re-measure if you change a scene.
BBOX = {
    "react-native-new-architecture-2026": [54, 24, 240, 96],
    "rbi-fintech-app-compliance-india": [83.7, 32, 236.3, 86],
    "react-native-push-notifications": [55, 16.5, 163, 106.5],
    "wordpress-website-cost-india": [
        48,
        36,
        256,
        78
    ],
    "wordpress-vs-custom-website": [
        40,
        36,
        320,
        78
    ],
    "woocommerce-payment-gateway-india": [
        46,
        42,
        212,
        104
    ],
    "wordpress-seo-speed-checklist": [
        162,
        66.5,
        76,
        43.5
    ],
    "native-vs-cross-platform-2026": [
        59,
        20,
        271,
        120
    ],
    "mvp-tech-stack-2026": [
        120,
        36,
        160,
        76
    ],
    "mobile-app-security-checklist": [
        96,
        30,
        216,
        90
    ],
    "app-monetization-models": [
        112,
        34,
        207,
        84.5
    ],
    "how-long-to-build-an-app": [
        64,
        32,
        196,
        92
    ],
    "ci-cd-react-native": [
        61,
        60,
        282,
        30
    ],
    "validate-app-idea-before-building": [
        142,
        36,
        168,
        84
    ],
    "app-store-launch-checklist": [
        143.5,
        36,
        188.5,
        92
    ],
    "app-maintenance-cost": [
        157.2,
        46.8,
        173.8,
        69.2
    ],
    "aws-cloud-migration-guide": [
        52,
        36.6,
        269.4,
        73.4
    ],
    "bsa-aml-software-build-vs-buy": [
        100,
        34,
        200,
        82
    ],
    "react-native-app-development-cost": [
        120,
        30,
        196,
        104
    ],
    "hire-react-native-developers": [
        115,
        45,
        170,
        77
    ],
    "ai-agent-development-services": [
        100,
        28,
        200,
        94
    ],
    "ai-app-development-cost-2026": [
        112,
        46,
        202,
        70
    ],
    "build-vs-buy-ai-cto-framework": [
        135,
        17,
        130,
        107
    ],
    "react-native-vs-flutter-2026": [
        102,
        45,
        184,
        69
    ],
    "nextjs-saas-architecture": [
        96,
        26,
        208,
        104
    ],
    "mvp-to-product-market-fit": [
        40,
        19,
        317,
        109
    ],
    "ai-react-native-app-development": [
        87,
        26,
        226,
        98
    ],
    "react-native-chatgpt-integration": [
        96,
        30,
        220,
        90
    ],
    "on-device-ai-react-native": [
        150,
        24,
        190,
        102
    ],
    "ai-chatbot-app-react-native": [
        104,
        40,
        196.1,
        80
    ],
    "kotlin-multiplatform-vs-react-native": [
        104,
        20,
        192,
        102
    ],
    "dpdp-act-app-compliance-india": [
        104,
        32,
        204.2,
        82
    ],
    "can-ai-build-my-app": [
        104,
        24,
        212,
        80
    ],
    "super-app-development": [
        150,
        18,
        100,
        114
    ]
}

CARD_ASPECT = 366 / 150   # real .blog-grid card at 3 columns
PAD_FRAC = 0.07


def fit(x, y, w, h):
    pad = max(w, h) * PAD_FRAC
    x, y, w, h = x - pad, y - pad, w + 2*pad, h + 2*pad
    # grow the deficient axis about the centre so the scene fills the card
    if w / h < CARD_ASPECT:
        nw = h * CARD_ASPECT
        x -= (nw - w) / 2
        w = nw
    else:
        nh = w / CARD_ASPECT
        y -= (nh - h) / 2
        h = nh
    r = lambda v: round(v, 1)
    return f"{r(x)} {r(y)} {r(w)} {r(h)}"

t = dict(S)
out = {}
for k, svg in t.items():
    vb = fit(*BBOX[k])
    out[k] = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', svg, count=1)
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else "thumbs.json", "w"))
print(f"generated {len(out)} thumbnails")

