"""Compose the 1024x500 Play Store feature graphic from the app icon art.
Run: python scripts/make_feature_graphic.py  ->  build/feature-graphic.png"""
from PIL import Image, ImageDraw, ImageFont, ImageChops
import random, os

W, H = 1024, 500
TOP = (22, 26, 70)      # deep night blue (from icon sky)
BOT = (44, 50, 108)
GOLD = (253, 236, 176)
GOLD_SOFT = (226, 196, 124)
FONTS = "C:/Windows/Fonts/"

# --- vertical gradient background ---
img = Image.new("RGB", (W, H))
px = img.load()
for y in range(H):
    t = y / (H - 1)
    row = tuple(round(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3))
    for x in range(W):
        px[x, y] = row

# --- warm radial glow behind where the jar sits (right) ---
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
cx, cy, r = 760, 250, 380
for rr in range(r, 0, -2):
    gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=int(80 * (1 - rr / r)))
img = Image.composite(Image.new("RGB", (W, H), (250, 224, 150)), img, glow)

# --- stars ---
rnd = random.Random(7)
d = ImageDraw.Draw(img)
for _ in range(75):
    x, y = rnd.randint(0, W), rnd.randint(0, int(H * 0.9))
    s = rnd.choice([1, 1, 1, 2])
    b = rnd.randint(150, 235)
    d.ellipse([x, y, x + s, y + s], fill=(b, b, min(255, b + 20)))

# --- jar art, cropped and feathered on the left so it melts into the bg ---
icon = Image.open("assets/images/icon.png").convert("RGBA")
crop = icon.crop((120, 40, 820, 1000))
th = H
tw = round(crop.width * th / crop.height)
crop = crop.resize((tw, th), Image.LANCZOS)

feather = Image.new("L", (tw, th), 255)
fp = feather.load()
fade = int(tw * 0.45)
for x in range(fade):
    v = int(255 * (x / fade) ** 1.4)
    for y in range(th):
        fp[x, y] = v
alpha = ImageChops.multiply(crop.split()[3], feather)
crop.putalpha(alpha)
jx = W - tw + 40
img.paste(crop, (jx, 0), crop)

# --- text on the left ---
d = ImageDraw.Draw(img)
title = ImageFont.truetype(FONTS + "georgiab.ttf", 92)
tag = ImageFont.truetype(FONTS + "georgiai.ttf", 34)

def shadow(xy, text, font, fill, sh=(0, 0, 0, 120)):
    x, y = xy
    d.text((x + 2, y + 3), text, font=font, fill=(0, 0, 0))
    d.text((x, y), text, font=font, fill=fill)

shadow((70, 150), "Story", title, GOLD)
shadow((70, 250), "Jar", title, GOLD)
d.text((74, 372), "Gentle moral stories for kids", font=tag, fill=(226, 214, 240))
d.text((74, 412), "read or listen", font=tag, fill=GOLD_SOFT)

os.makedirs("build", exist_ok=True)
out = "build/feature-graphic.png"
img.save(out, "PNG")
print("wrote", out, img.size)
