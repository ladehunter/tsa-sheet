import json

data = json.load(open("/tmp/opencode/tsa_data.json", encoding="utf-8"))
js_data = json.dumps(data, ensure_ascii=False, indent=1)
js_data = js_data.replace("</", "<\\/")

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>TSA 9周计划 · 减脂版训练表</title>
<style>
:root {
  --bg: #f2f4f7;
  --card: #ffffff;
  --ink: #1a1f2b;
  --ink2: #4a5468;
  --line: #d7dce4;
  --accent: #0b62d6;
  --accent-ink: #ffffff;
  --lift: #0b62d6;
  --soft: #eef3fb;
  --warn: #a33a00;
  --ok: #0a6b3d;
  --rest: #6a7285;
  --radius: 14px;
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: rgba(11,98,214,.15); }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: system-ui, -apple-system, "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: var(--ink);
  background: var(--bg);
  padding-bottom: 40px;
  word-break: break-word;
  overflow-wrap: anywhere;
}
button, input, select { font: inherit; color: inherit; }

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--accent);
  color: var(--accent-ink);
  padding: 10px 14px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.22);
}
.topbar h1 { font-size: 18px; font-weight: 700; line-height: 1.3; }
.topbar .sub { font-size: 13px; opacity: .92; margin-bottom: 8px; white-space: normal; }
.onrm-row { display: flex; flex-wrap: wrap; gap: 8px; }
.onrm {
  flex: 1 1 90px;
  min-width: 90px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.45);
  border-radius: 10px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
}
.onrm label { font-size: 13px; font-weight: 600; }
.onrm input {
  width: 100%;
  margin-top: 2px;
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 4px 10px;
  background: #fff;
  color: var(--ink);
  font-weight: 700;
  font-size: 17px;
}
.onrm input:focus { outline: 3px solid rgba(255,255,255,.7); outline-offset: 1px; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px 0;
  max-width: 760px;
  margin: 0 auto;
}
.btn {
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--accent);
  background: var(--card);
  color: var(--accent);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}
.btn:active { background: var(--soft); }

main { max-width: 760px; margin: 0 auto; padding: 14px 14px 0; }

.acc {
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 14px;
  overflow: visible;
}
.acc-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  min-height: 52px;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
}
.acc-head .chev { font-size: 13px; color: var(--ink2); flex: none; transition: transform .18s; }
.acc.open .acc-head .chev { transform: rotate(90deg); }
.acc-head .ttl { font-size: 17px; font-weight: 800; flex: 1; }
.acc-head .tag { font-size: 12px; font-weight: 600; color: var(--ink2); background: var(--soft); border-radius: 999px; padding: 2px 9px; flex: none; }
.acc-body { display: none; padding: 0 12px 12px; }
.acc.open .acc-body { display: block; }
.acc.open { border-color: var(--accent); }

.day-card {
  border: 1.5px solid var(--line);
  border-radius: 12px;
  margin: 10px 0 14px;
  background: #fafbfd;
}
.day-head {
  padding: 10px 12px;
  font-weight: 800;
  font-size: 15.5px;
  background: var(--soft);
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid var(--line);
  white-space: normal;
  line-height: 1.5;
}
.day-body { padding: 8px 8px 10px; }

.ex-card {
  background: var(--card);
  border: 1.5px solid var(--line);
  border-left: 5px solid var(--lift);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
}
.ex-card.rest { border-left-color: var(--rest); background: #f3f4f8; }
.ex-top { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.ex-name { font-size: 16px; font-weight: 800; line-height: 1.45; }
.ex-sets { font-size: 14px; font-weight: 700; color: var(--ink2); }
.badge {
  display: inline-block;
  font-size: 12.5px;
  font-weight: 700;
  padding: 1px 9px;
  border-radius: 999px;
  margin: 3px 4px 0 0;
  white-space: nowrap;
}
.badge.i { background: var(--soft); color: var(--accent); border: 1px solid var(--line); }
.badge.r { background: var(--card); color: var(--ink2); border: 1px solid var(--line); }
.badge.n { background: var(--card); color: var(--ink2); border: 1px solid var(--line); }
.wline { margin-top: 4px; }
.wlabel { font-size: 13px; color: var(--ink2); font-weight: 600; }
.wval { font-size: 24px; font-weight: 900; color: var(--lift); line-height: 1.25; }
.wval.na { font-size: 18px; color: var(--ink2); font-weight: 700; }
.ex-note {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--warn);
  background: #fff5ee;
  border: 1px solid #f3d9c2;
  border-radius: 8px;
  padding: 5px 9px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.ex-note.n { color: var(--ink2); background: #f2f4f8; border-color: var(--line); }
.orig {
  margin-top: 5px;
  font-size: 12.5px;
  color: var(--ink2);
  white-space: normal;
}

.logrow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
.log { flex: 1 1 86px; min-width: 86px; }
.log label { display: block; font-size: 12.5px; font-weight: 700; color: var(--ink2); margin-bottom: 2px; }
.log input {
  width: 100%;
  min-height: 42px;
  padding: 4px 10px;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: #fff;
  font-size: 16px;
  font-weight: 600;
}
.log input:focus { outline: 3px solid var(--soft); border-color: var(--accent); }
.log input::placeholder { color: #9aa3b5; font-weight: 500; }
.log input[data-filled="1"] { border-color: var(--ok); background: #f0faf4; }

.wk-copy { margin: 2px 0 12px; width: 100%; }
.btn.small { min-height: 42px; font-size: 14.5px; }
.btn.ghost { border-color: var(--ink2); color: var(--ink2); }

.intro-sec { padding: 2px 6px 6px; }
.intro-sec h2 {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  margin: 14px 0 4px;
  line-height: 1.5;
}
.intro-sec h2.first { margin-top: 4px; }
.intro-sec p {
  font-size: 15px;
  color: var(--ink);
  padding: 6px 10px;
  background: #f6f8fb;
  border-left: 4px solid var(--accent);
  border-radius: 0 8px 8px 0;
  margin: 6px 0;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.intro-sec p.warn { border-left-color: var(--warn); background: #fff5ee; }
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  background: rgba(20,24,32,.92);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  z-index: 99;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s;
  max-width: 86vw;
  white-space: normal;
  text-align: center;
}
.toast.show { opacity: 1; }
a { color: var(--accent); text-decoration: underline; }
.footnote { font-size: 12.5px; color: var(--ink2); padding: 4px 14px 0; max-width: 760px; margin: 0 auto; white-space: normal; }
</style>
</head>
<body>
<div class="topbar">
  <h1>TSA 9周计划 · 减脂版训练表</h1>
  <div class="sub">W1-4 容量期 → W5 减载 → W6-8 巅峰期 → W9 测试周 · 每周4练</div>
  <div class="onrm-row">
    <div class="onrm"><label for="rm-squat">深蹲 1RM (kg)</label><input id="rm-squat" type="number" step="2.5" min="0" inputmode="decimal" value="205"></div>
    <div class="onrm"><label for="rm-bench">卧推 1RM (kg)</label><input id="rm-bench" type="number" step="2.5" min="0" inputmode="decimal" value="132.5"></div>
    <div class="onrm"><label for="rm-dead">硬拉 1RM (kg)</label><input id="rm-dead" type="number" step="2.5" min="0" inputmode="decimal" value="215"></div>
  </div>
</div>
<div class="toolbar">
  <button class="btn" id="btn-open-all">展开全部</button>
  <button class="btn" id="btn-close-all">收起全部</button>
  <button class="btn" id="btn-export">导出备份</button>
  <button class="btn" id="btn-import">导入备份</button>
  <input type="file" id="file-import" accept=".json,application/json" style="display:none">
</div>
<main id="app"></main>
<div class="footnote">数据与结构出品: The Strength Athlete (Bryce Lewis / Hani Jazayrli) · 本页为离线单文件版，训练记录保存在本机浏览器 localStorage。</div>
<div class="toast" id="toast"></div>
<div id="clipboard-helper" aria-hidden="true"></div>

<script>
"use strict";
var DATA = __DATA__;

var LS_1RM = "tsa_cut.1rm";
var LS_LOG = "tsa_cut.logs";
var LIFTS = { squat: "rm-squat", bench: "rm-bench", dead: "rm-dead" };
var LIFT_NAME = { squat: "深蹲", bench: "卧推", dead: "硬拉" };

var state = { logs: {} };

function $(s, el) { return (el || document).querySelector(s); }
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null && text !== "") n.textContent = text;
  return n;
}

function esc(s) { return String(s); }

function get1RM() {
  var out = {};
  for (var k in LIFTS) {
    var v = parseFloat($("#" + LIFTS[k]).value);
    out[k] = isNaN(v) || v <= 0 ? 0 : v;
  }
  return out;
}

function round2_5(x) { return Math.round(x / 2.5) * 2.5; }

function computeWeight(ex, rm) {
  if (ex.rpe || !ex.pct || !ex.family || ex.family === "none") return null;
  var rmv = rm[ex.family];
  if (!rmv) return null;
  var raw = rmv * ex.pct / 100;
  var near = Math.round(raw);
  if (Math.abs(raw - near) < 1e-9) return near;
  return round2_5(raw);
}

function numFmt(w) {
  if (w === null || w === undefined) return "";
  return (w % 1 === 0) ? String(w) : w.toFixed(1);
}

function toast(msg) {
  var t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

function saveLogs() {
  try { localStorage.setItem(LS_LOG, JSON.stringify(state.logs)); }
  catch (e) { toast("保存失败：浏览器存储不可用"); }
}
function loadLogs() {
  try {
    var raw = localStorage.getItem(LS_LOG);
    if (raw) state.logs = JSON.parse(raw) || {};
  } catch (e) { state.logs = {}; }
}
function save1RM() {
  try { localStorage.setItem(LS_1RM, JSON.stringify(get1RM())); }
  catch (e) {}
}
function load1RM() {
  try {
    var raw = localStorage.getItem(LS_1RM);
    if (!raw) return;
    var v = JSON.parse(raw);
    for (var k in LIFTS) {
      if (v && k in v && !isNaN(parseFloat(v[k]))) {
        $("#" + LIFTS[k]).value = v[k];
      }
    }
  } catch (e) {}
}

function logKey(w, d, i) { return "w" + w + "d" + d + "e" + i; }

function buildIntro() {
  var sec = el("section", "acc open");
  var head = el("button", "acc-head");
  head.type = "button";
  head.appendChild(el("span", "chev", "▶"));
  head.appendChild(el("span", "ttl", "使用说明（完整）"));
  head.appendChild(el("span", "tag", "先读我"));
  head.addEventListener("click", function () { sec.classList.toggle("open"); });
  var body = el("div", "acc-body intro-sec");
  var lines = DATA.intro.lines;
  var idx = 0;
  var firstH = true;
  for (var li = 0; li < lines.length; li++) {
    var L = lines[li];
    if (L.t === "h") {
      var h = el("h2", firstH ? "first" : "", L.x);
      firstH = false;
      body.appendChild(h);
    } else {
      var isWarn = /警报信号|减脂期使用规则|缩缺口|回检饮食|宁轻勿重/.test(L.x);
      var p = el("p", isWarn ? "warn" : "", L.x);
      body.appendChild(p);
    }
    idx++;
  }
  sec.appendChild(head);
  sec.appendChild(body);
  return sec;
}

function buildExercise(ex, w, d, i) {
  var card = el("div", "ex-card" + (/^休息/.test(ex.name) ? " rest" : ""));
  var top = el("div", "ex-top");
  top.appendChild(el("span", "ex-name", ex.name));
  if (ex.sets) top.appendChild(el("span", "ex-sets", ex.sets));
  card.appendChild(top);

  var badges = el("div", "badges");
  if (ex.intensity) {
    var bi = el("span", "badge i", ex.intensity);
    badges.appendChild(bi);
  }
  if (ex.rest) {
    var br = el("span", "badge r", "组间 " + ex.rest);
    badges.appendChild(br);
  }
  card.appendChild(badges);

  var rm = get1RM();
  var wv = computeWeight(ex, rm);
  var wline = el("div", "wline");
  var isRest = /^休息/.test(ex.name);
  if (isRest) {
    wline.appendChild(el("span", "wlabel", "——"));
  } else if (ex.rpe || wv === null) {
    wline.appendChild(el("span", "wlabel", ex.family && ex.family !== "none" ? ("参考 " + LIFT_NAME[ex.family] + " 1RM · ") : ""));
    var na = el("span", "wval na", "按RPE自选");
    wline.appendChild(na);
  } else {
    wline.appendChild(el("span", "wlabel", "目标重量 = " + numFmt(rm[ex.family]) + " × " + ex.pct + "%"));
    var big = el("span", "wval");
    big.textContent = numFmt(wv) + " kg";
    wline.appendChild(big);
  }
  card.appendChild(wline);

  if (ex.orig && ex.orig !== "按RPE自选") {
    card.appendChild(el("div", "orig", "原表参考重量：" + ex.orig + "（按原表示例 1RM 计算）"));
  }
  if (ex.note) {
    var note = el("div", "ex-note" + (/^(顶组|回退组)/.test(ex.note) ? " n" : ""), "备注：" + ex.note);
    card.appendChild(note);
  }

  if (!isRest) {
    var key = logKey(w, d, i);
    var rec = state.logs[key] || {};
    var row = el("div", "logrow");
    var mk = function (label, field, ph, step) {
      var box = el("div", "log");
      var lb = el("label", "", label);
      box.appendChild(lb);
      var inp = el("input");
      inp.type = "number";
      if (step) inp.step = step;
      inp.inputMode = "decimal";
      inp.placeholder = ph;
      inp.autocomplete = "off";
      var v = rec[field];
      if (v !== undefined && v !== null && v !== "") {
        inp.value = v;
        inp.setAttribute("data-filled", "1");
      }
      inp.addEventListener("input", function () {
        var cur = state.logs[key] || {};
        var val = inp.value;
        if (val === "") delete cur[field];
        else cur[field] = val;
        if (Object.keys(cur).length === 0) delete state.logs[key];
        else state.logs[key] = cur;
        if (val !== "") inp.setAttribute("data-filled", "1");
        else inp.removeAttribute("data-filled");
        saveLogs();
      });
      box.appendChild(inp);
      return box;
    };
    var wph = wv !== null ? String(numFmt(wv)) : "";
    row.appendChild(mk("实际重量(kg)", "w", wph, "2.5"));
    row.appendChild(mk("实际次数", "r", ex.sets ? ex.sets.split("×").pop() : "", "1"));
    row.appendChild(mk("实际RPE", "p", "", "0.5"));
    card.appendChild(row);
  }
  return card;
}

function buildWeek(week) {
  var sec = el("section", "acc");
  sec.id = "week-" + week.n;
  var head = el("button", "acc-head");
  head.type = "button";
  head.appendChild(el("span", "chev", "▶"));
  head.appendChild(el("span", "ttl", week.title));
  var exCount = 0;
  for (var di = 0; di < week.days.length; di++) exCount += week.days[di].ex.length;
  head.appendChild(el("span", "tag", week.days.length + "天 · " + exCount + "动作"));
  head.addEventListener("click", function () { sec.classList.toggle("open"); });
  var body = el("div", "acc-body");

  var copyBtn = el("button", "btn small ghost wk-copy", "复制本周记录");
  copyBtn.type = "button";
  copyBtn.addEventListener("click", function () { copyWeek(week.n); });
  body.appendChild(copyBtn);

  for (var d = 0; d < week.days.length; d++) {
    var day = week.days[d];
    var dc = el("div", "day-card");
    var dh = el("div", "day-head", day.title);
    dc.appendChild(dh);
    var db = el("div", "day-body");
    for (var i = 0; i < day.ex.length; i++) {
      db.appendChild(buildExercise(day.ex[i], week.n, d, i));
    }
    dc.appendChild(db);
    body.appendChild(dc);
  }
  sec.appendChild(head);
  sec.appendChild(body);
  return sec;
}

function recomputeAll() {
  var rm = get1RM();
  var secs = document.querySelectorAll(".acc");
  secs.forEach(function (sec) {
    if (sec.id && sec.id.indexOf("week-") === 0) {
      var wn = parseInt(sec.id.slice(5), 10);
      var wk = DATA.weeks[wn - 1];
      var bodies = sec.querySelectorAll(".day-body");
      for (var d = 0; d < bodies.length; d++) {
        var cards = bodies[d].querySelectorAll(".ex-card");
        for (var i = 0; i < cards.length; i++) {
          var fresh = buildExercise(wk.days[d].ex[i], wn, d, i);
          var logIn = fresh.querySelector(".logrow input");
          var oldIn = cards[i].querySelector(".logrow input");
          if (logIn && oldIn && oldIn.value) {
            var inputs = fresh.querySelectorAll(".logrow input");
            var olds = cards[i].querySelectorAll(".logrow input");
            for (var k = 0; k < inputs.length; k++) {
              inputs[k].value = olds[k].value;
              if (olds[k].value) inputs[k].setAttribute("data-filled", "1");
            }
          }
          cards[i].parentNode.replaceChild(fresh, cards[i]);
        }
      }
    }
  });
}

function copyTextCompat(text, done) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "readonly");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  if (ok) { done(true); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
  } else {
    done(false);
  }
}

function copyWeek(wn) {
  var wk = DATA.weeks[wn - 1];
  var rm = get1RM();
  var lines = [];
  lines.push("【" + wk.title + "】");
  lines.push("1RM: 深蹲" + numFmt(rm.squat) + " / 卧推" + numFmt(rm.bench) + " / 硬拉" + numFmt(rm.dead) + " kg");
  for (var d = 0; d < wk.days.length; d++) {
    var day = wk.days[d];
    lines.push("");
    lines.push("◆ " + day.title);
    for (var i = 0; i < day.ex.length; i++) {
      var ex = day.ex[i];
      var key = logKey(wn, d, i);
      var rec = state.logs[key] || {};
      var target = computeWeight(ex, rm);
      var tStr = ex.rpe ? "按RPE自选" : (target === null ? "" : numFmt(target) + "kg");
      var line = "· " + ex.name + " " + ex.sets + " " + ex.intensity;
      if (tStr) line += " 目标" + tStr;
      line += " | 实际: 重量" + (rec.w || "–") + "kg 次数" + (rec.r || "–") + " RPE" + (rec.p || "–");
      if (ex.rest) line += " 组间" + ex.rest;
      if (ex.note) line += " 备注:" + ex.note;
      lines.push(line);
    }
  }
  var text = lines.join("\n");
  copyTextCompat(text, function (ok) {
    toast(ok ? "第" + wn + "周记录已复制到剪贴板" : "复制失败，请长按手动复制（内容已尝试写入剪贴板）");
    if (!ok) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "static";
      ta.style.width = "100%";
      ta.style.minHeight = "180px";
      ta.style.margin = "8px 0";
      var app = $("#app");
      app.insertBefore(ta, app.firstChild);
      ta.focus();
      ta.select();
    }
  });
}

function doExport() {
  var payload = {
    app: "tsa-cut",
    version: 1,
    exportedAt: new Date().toISOString(),
    onerm: get1RM(),
    logs: state.logs
  };
  var text = JSON.stringify(payload, null, 1);
  try {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "TSA减脂训练记录备份_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast("备份文件已开始下载");
  } catch (e) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.width = "100%";
    ta.style.minHeight = "220px";
    var app = $("#app");
    app.insertBefore(ta, app.firstChild);
    toast("下载不可用，请手动复制下方JSON文本保存");
    ta.focus();
    ta.select();
  }
}

function doImport(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var obj = JSON.parse(reader.result);
      if (!obj || typeof obj !== "object" || (!obj.logs && !obj.onerm)) {
        toast("导入失败：不是有效的备份文件");
        return;
      }
      if (obj.onerm) {
        for (var k in LIFTS) {
          if (k in obj.onerm && !isNaN(parseFloat(obj.onerm[k]))) {
            $("#" + LIFTS[k]).value = obj.onerm[k];
          }
        }
        save1RM();
      }
      if (obj.logs && typeof obj.logs === "object") {
        state.logs = obj.logs;
        saveLogs();
      }
      recomputeAll();
      toast("导入成功：1RM 与训练记录已恢复");
    } catch (e) {
      toast("导入失败：JSON 解析错误");
    }
  };
  reader.onerror = function () { toast("导入失败：无法读取文件"); };
  reader.readAsText(file);
}

function init() {
  load1RM();
  loadLogs();
  var app = $("#app");
  app.appendChild(buildIntro());
  for (var i = 0; i < DATA.weeks.length; i++) {
    app.appendChild(buildWeek(DATA.weeks[i]));
  }
  ["rm-squat", "rm-bench", "rm-dead"].forEach(function (id) {
    $("#" + id).addEventListener("input", function () {
      save1RM();
      recomputeAll();
    });
  });
  $("#btn-open-all").addEventListener("click", function () {
    document.querySelectorAll(".acc").forEach(function (s) { s.classList.add("open"); });
  });
  $("#btn-close-all").addEventListener("click", function () {
    document.querySelectorAll(".acc").forEach(function (s) { s.classList.remove("open"); });
  });
  $("#btn-export").addEventListener("click", doExport);
  $("#btn-import").addEventListener("click", function () { $("#file-import").click(); });
  $("#file-import").addEventListener("change", function () {
    if (this.files && this.files[0]) doImport(this.files[0]);
    this.value = "";
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
</script>
</body>
</html>
"""

HTML = HTML.replace("__DATA__", js_data)
with open("/home/haoluo/TSA_减脂版训练表.html", "w", encoding="utf-8") as f:
    f.write(HTML)
print("written bytes:", len(HTML.encode("utf-8")))
