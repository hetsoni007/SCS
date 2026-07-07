#!/usr/bin/env python3
"""Motion-cover MP4 generator (1080x1350, loops) for Instagram.
Frames are computed in Python (deterministic inline styles per t), rendered in
strips via headless Chrome, cropped with PIL, encoded with imageio-ffmpeg.
Usage: python3 social-kit/video.py <slug>
"""
import os, sys, math, glob, shutil, subprocess, importlib.util
from PIL import Image
import imageio_ffmpeg

HERE = os.path.abspath(os.path.dirname(__file__))
spec = importlib.util.spec_from_file_location("gen", os.path.join(HERE, "gen.py"))
gen = importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)

W, H = 1080, 1350
FPS = 20
DUR = 10.0
PER_STRIP = 5

def clamp01(x): return max(0.0, min(1.0, x))
def seg(t, a, b): return clamp01((t - a) / (b - a))
def ease_out(x): x = clamp01(x); return 1 - (1 - x) ** 3
def ease_io(x): x = clamp01(x); return x * x * (3 - 2 * x)

def fx(t, a, b, rise=26):
    """fade+rise style for element appearing between a..b"""
    p = ease_out(seg(t, a, b))
    return f"opacity:{p:.3f};transform:translateY({(1-p)*rise:.1f}px)"

# ---------------- scenes ----------------
CFGS = {
  "native-vs-cross-platform-2026": dict(
    eyebrow="Decision guide", cat="Mobile · 2026",
    l1='Native <span class="gold">or</span>', l2='Cross-Platform?',
    sub='Pick wrong and your app can cost <b>2&#215; more.</b>',
    chips=["React Native","Flutter","Native"],
    cta='Take the 30-sec decision tool &#8594;'),
  "mvp-tech-stack-2026": dict(
    eyebrow="Interactive picker", cat="MVP · 2026",
    l1='Which <span class="gold">stack</span>', l2='for your MVP?',
    sub='The wrong stack <b>taxes every sprint.</b>',
    chips=["RN + MERN","Next.js","Firebase"],
    cta='Take the 30-sec stack picker &#8594;'),
  "mobile-app-security-checklist": dict(
    eyebrow="Self-audit", cat="Mobile · Security",
    l1='Is your app', l2='<span class="gold">actually secure?</span>',
    sub='Most breaches are <b>basics not done.</b>',
    chips=["Tokens","Secrets","APIs"],
    cta='Score your app in 2 minutes &#8594;'),
  "app-monetization-models": dict(
    eyebrow="Revenue explorer", cat="Strategy · 2026",
    l1='How will your app', l2='<span class="gold">make money?</span>',
    sub='Drag the sliders. <b>See the math.</b>',
    chips=["Subscription","Ads","Commission"],
    cta='Try the revenue explorer &#8594;'),
}

def scene(t, cfg):
    g = min(ease_io(seg(t, 0.0, 0.35)), 1 - ease_io(seg(t, 9.45, 10.0)))
    ox = 22 + 14 * math.sin(2 * math.pi * t / DUR)
    oy = 12 + 9 * math.cos(2 * math.pi * t / DUR)
    orb = (f'<div style="position:absolute;z-index:0;left:{ox}%;top:{oy}%;width:640px;height:640px;'
           'background:radial-gradient(circle,rgba(201,162,75,.20),transparent 62%);border-radius:50%"></div>')
    chips = ""
    for i, lb in enumerate(cfg["chips"]):
        a = 2.9 + i * 0.35
        p = ease_out(seg(t, a, a + 0.55))
        hi = 0.0
        if 5.0 <= t <= 7.9:
            ph = (t - 5.0) / 0.95
            hi = max(0.0, 1 - abs(ph - i) * 1.4) if 0 <= ph <= 3 else 0.0
        bc = f"rgba(201,162,75,{0.35 + 0.65 * hi:.2f})"
        glow = f"box-shadow:0 0 {28 * hi:.0f}px rgba(201,162,75,{0.5 * hi:.2f});" if hi > 0.02 else ""
        chips += (f'<span style="display:inline-block;margin-right:22px;font-size:30px;font-weight:600;color:#EFE6D0;'
                  f'border:2px solid {bc};border-radius:999px;padding:16px 34px;{glow}'
                  f'opacity:{p:.3f};transform:scale({0.86 + 0.14 * p:.3f})">{lb}</span>')
    pulse = 1 + (0.018 * math.sin(2 * math.pi * (t - 7.8) / 1.3) if t > 7.8 else 0)
    cta = (f'<div style="{fx(t, 7.7, 8.4, 30)};margin-top:64px">'
           f'<span class="pill" style="transform:scale({pulse:.3f});display:inline-block">{cfg["cta"]}</span>'
           f'<span style="font-size:26px;color:#9a948b;margin-left:26px">link in bio</span></div>')
    inner = (orb +
      f'<div class="top" style="{fx(t, 0.05, 0.7, 18)}">' + gen.brand() +
      f'<span class="eyebrow"><span class="dot"></span>{cfg["eyebrow"]}</span></div>'
      '<div class="mid">'
      f'<div class="eyebrow" style="margin-bottom:26px;{fx(t, 0.35, 1.0)}">{cfg["cat"]}</div>'
      f'<div class="h" style="{fx(t, 0.55, 1.35, 40)}">{cfg["l1"]}</div>'
      f'<div class="h" style="{fx(t, 0.8, 1.6, 40)}">{cfg["l2"]}</div>'
      f'<div class="sub" style="{fx(t, 1.7, 2.5)}">{cfg["sub"]}</div>'
      f'<div style="margin-top:54px">{chips}</div>'
      + cta + '</div>'
      + f'<div style="{fx(t, 0.6, 1.2, 0)}">' + gen.foot('<span class="h2n">soniconsultancyservices.com</span>') + '</div>')
    return (f'<div style="opacity:{g:.3f};display:flex;flex-direction:column;flex:1;min-height:0">{inner}</div>'
            .replace("{inner}", inner))

SCENES = {k: (lambda t, c=v: scene(t, c)) for k, v in CFGS.items()}

# ---------------- pipeline ----------------
def strip_html(ts):
    body = "".join(f'<div class="slide">{SCENES[SLUG](t)}</div>' for t in ts)
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{gen.css(W, H, 96)}'
            'body{display:block}.slide{margin:0}</style></head><body>' + body + '</body></html>')

def build(slug):
    global SLUG
    SLUG = slug
    outdir = os.path.join(gen.ROOT, "social-kit", slug)
    os.makedirs(outdir, exist_ok=True)
    fdir = os.path.join(outdir, "_frames")
    shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
    n = int(FPS * DUR)
    times = [i / FPS for i in range(n)]
    strips = [times[i:i + PER_STRIP] for i in range(0, n, PER_STRIP)]
    fi = 0
    for si, ts in enumerate(strips):
        sp = os.path.join(fdir, f"strip{si:03d}.png")
        gen.render(strip_html(ts), sp, W, H * len(ts))
        im = Image.open(sp)
        for k in range(len(ts)):
            im.crop((0, k * H, W, (k + 1) * H)).save(os.path.join(fdir, f"f{fi:04d}.png"))
            fi += 1
        im.close(); os.remove(sp)
        if si % 8 == 0:
            print(f"  strips {si + 1}/{len(strips)}")
    mp4 = os.path.join(outdir, "motion-cover.mp4")
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([exe, "-y", "-loglevel", "error", "-framerate", str(FPS),
                    "-i", os.path.join(fdir, "f%04d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19",
                    "-movflags", "+faststart", mp4], check=True)
    shutil.rmtree(fdir)
    print("DONE:", mp4)

if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "native-vs-cross-platform-2026")
