import json

SRC = "/tmp/opencode"

data = json.load(open(SRC + "/tsa_data.json", encoding="utf-8"))
js_data = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")

css = open(SRC + "/v2/style.css", encoding="utf-8").read()
body = open(SRC + "/v2/body.html", encoding="utf-8").read()
core = open(SRC + "/v2/app_core.js", encoding="utf-8").read()
ui = open(SRC + "/v2/app_ui.js", encoding="utf-8").read()

HTML = (
    '<!DOCTYPE html>\n'
    '<html lang="zh-CN">\n'
    '<head>\n'
    '<meta charset="UTF-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    '<meta name="color-scheme" content="light">\n'
    '<meta name="generator" content="build_html_v2 v2-mobile">\n'
    '<title>TSA 9周计划 · 减脂版训练表</title>\n'
    '<style>\n__CSS__\n</style>\n'
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

out = "/home/haoluo/TSA_减脂版训练表.html"
with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)
print("written:", out, "bytes:", len(HTML.encode("utf-8")))
