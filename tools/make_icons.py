# -*- coding: utf-8 -*-
"""抠掉图标边缘深色背景 -> 圆角透明 -> 多尺寸 PNG + .ico"""
import os
from PIL import Image, ImageDraw, ImageFilter

SRC = r"C:\Users\zy_001\Desktop\新建文件夹 (2)\软件图标（需要扣掉边缘深色部分）.png"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "icons")

os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = img.load()

# 1) 检测非深色像素的包围盒（背景为深色，亮度阈值以下视为背景）
def is_dark(p):
    r, g, b, a = p
    return (r + g + b) / 3 < 70

xs, ys = [], []
step = 1 if max(w, h) <= 800 else 2
for y in range(0, h, step):
    for x in range(0, w, step):
        if not is_dark(px[x, y]):
            xs.append(x)
            ys.append(y)

assert xs, "未检测到前景图标"
left, right = min(xs), max(xs)
top, bottom = min(ys), max(ys)

# 稍微内缩 1px 防止残留背景描边，再外扩 0 保持内容完整
box = (left + 1, top + 1, right, bottom)
icon = img.crop(box)

# 2) 归一化到 1024 x 1024
size = 1024
side = max(icon.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(icon, ((side - icon.width) // 2, (side - icon.height) // 2))
icon = canvas.resize((size, size), Image.LANCZOS)

# 3) 圆角遮罩（iOS 风格约 22.5% 圆角）
mask = Image.new("L", (size, size), 0)
d = ImageDraw.Draw(mask)
radius = int(size * 0.225)
d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1))
icon.putalpha(mask)

# 4) 输出多尺寸 PNG
png_sizes = [512, 256, 128, 64, 48, 32, 24, 16]
for s in png_sizes:
    icon.resize((s, s), Image.LANCZOS).save(os.path.join(OUT_DIR, f"icon_{s}.png"))

icon.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT_DIR, "icon.png"))

# 5) 输出 .ico（Windows 多分辨率；显式 BMP 位图条目，兼容 LoadImage 加载路径）
icon.save(
    os.path.join(OUT_DIR, "icon.ico"),
    format="ICO",
    sizes=[(s, s) for s in [16, 24, 32, 48, 64, 128, 256]],
    bitmap_format="bmp",
)

print("DONE", box, "size:", icon.size)
