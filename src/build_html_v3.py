import base64
import json
import struct
import zlib

SRC = "/tmp/opencode"
OUT = "/home/haoluo/tsa_pwa/index.html"

tsa = json.load(open(SRC + "/tsa_data.json", encoding="utf-8"))

tsa_prog = dict(tsa)
tsa_prog["id"] = "tsa"
tsa_prog["name"] = "TSA 减脂 9周"

programs = [
    tsa_prog,
    {
        "id": "jt20",
        "name": "JT 2.0 预留",
        "desc": "增肌块模板预留",
        "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入",
    },
    {
        "id": "rippler",
        "name": "Rippler 预留",
        "desc": "峰值块模板预留",
        "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入",
    },
]

data = {"programs": programs}
js_data = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")


def png_chunk(typ, data_bytes):
    c = typ + data_bytes
    return struct.pack(">I", len(data_bytes)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)


def in_rrect(x, y, x0, y0, x1, y1, r):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def build_icon():
    W = H = 64
    DARK = (23, 24, 28, 255)
    ORANGE = (245, 166, 35, 255)
    BAR = (255, 255, 255, 255)
    px = [[(0, 0, 0, 0)] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if in_rrect(x, y, 2, 2, 61, 61, 12):
                px[y][x] = DARK
    for y in range(H):
        for x in range(W):
            if in_rrect(x, y, 50, 50, 63, 63, 5):
                px[y][x] = ORANGE
    def fill(x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(H, y1 + 1)):
            for x in range(max(0, x0), min(W, x1 + 1)):
                px[y][x] = c
    fill(10, 30, 53, 33, BAR)
    fill(12, 22, 18, 41, BAR)
    fill(45, 22, 51, 41, BAR)
    rows = []
    for y in range(H):
        rb = bytearray()
        for x in range(W):
            rb.extend(px[y][x])
        rows.append(b"\x00" + bytes(rb))
    raw = b"".join(rows)
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n"
           + png_chunk(b"IHDR", ihdr)
           + png_chunk(b"IDAT", zlib.compress(raw, 9))
           + png_chunk(b"IEND", b""))
    return "data:image/png;base64," + base64.b64encode(png).decode()


ICON = build_icon()

css = open(SRC + "/v3/style.css", encoding="utf-8").read()
body = open(SRC + "/v3/body.html", encoding="utf-8").read()
core = open(SRC + "/v3/app_core.js", encoding="utf-8").read()
ui = open(SRC + "/v3/app_ui.js", encoding="utf-8").read()

HTML = (
    '<!DOCTYPE html>\n'
    '<html lang="zh-CN">\n'
    '<head>\n'
    '<meta charset="UTF-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    '<meta name="color-scheme" content="light">\n'
    '<meta name="generator" content="build_html_v3 v3-coach">\n'
    '<title>TSA 减脂教练 · 训练 饮食 心肺 体重</title>\n'
    '<style>\n__CSS__\n</style>\n'
    '<link rel="manifest" href="manifest.webmanifest">\n'
    '<meta name="theme-color" content="#17181c">\n'
    '<link rel="icon" href="' + ICON + '">\n'
    '<script>if(location.protocol.startsWith(\'http\')&&\'serviceWorker\' in navigator){window.addEventListener(\'load\',function(){navigator.serviceWorker.register(\'sw.js\').catch(function(){});});}</script>\n'
    '</head>\n'
    '<body>\n__BODY__\n'
    '<script>\n'
    '"use strict";\n'
    'var DATA = __DATA__;\n\n'
    '__CORE__\n\n'
    '__UI__\n'
    '</script>\n'
    '</body>\n'
    '</html>\n'
)

HTML = (HTML
        .replace("__CSS__", css)
        .replace("__BODY__", body)
        .replace("__DATA__", js_data)
        .replace("__CORE__", core)
        .replace("__UI__", ui))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(HTML)

n_ex = sum(len(d["ex"]) for w in programs[0]["weeks"] for d in w["days"])
print("written:", OUT, "bytes:", len(HTML.encode("utf-8")))
print("programs:", [p["name"] for p in programs])
print("TSA exercises:", n_ex)
