
"use strict";
var __all = [];
var __store = new Map();
var localStorage = {
  getItem: function (k) { return __store.has(k) ? __store.get(k) : null; },
  setItem: function (k, v) { __store.set(k, String(v)); },
  removeItem: function (k) { __store.delete(k); }
};

function selToPred(s) {
  if (s.charAt(0) === "#") { var id = s.slice(1); return function (e) { return e.id === id; }; }
  if (s.charAt(0) === ".") {
    var cls = s.slice(1).split(".");
    return function (e) {
      for (var i = 0; i < cls.length; i++) if (!e.classList.contains(cls[i])) return false;
      return true;
    };
  }
  var dot = s.indexOf(".");
  if (dot > 0) {
    var tg = s.slice(0, dot).toUpperCase();
    var cl = s.slice(dot + 1).split(".");
    return function (e) {
      if ((e.tagName || "").toUpperCase() !== tg) return false;
      for (var i = 0; i < cl.length; i++) if (!e.classList.contains(cl[i])) return false;
      return true;
    };
  }
  var tg2 = s.toUpperCase();
  return function (e) { return (e.tagName || "").toUpperCase() === tg2; };
}
function compileSel(sel) {
  var parts = sel.trim().split(/\s+/).map(function (p) { return selToPred(p); });
  if (parts.length === 1) return parts[0];
  return function (e) {
    if (!parts[parts.length - 1](e)) return false;
    var need = parts.slice(0, -1);
    var node = e.parentNode;
    var ni = need.length - 1;
    while (node && ni >= 0) {
      if (need[ni](node)) ni--;
      node = node.parentNode;
    }
    return ni < 0;
  };
}
function searchAll(root, pred, out) {
  var ch = root.children || [];
  for (var i = 0; i < ch.length; i++) {
    if (pred(ch[i])) out.push(ch[i]);
    searchAll(ch[i], pred, out);
  }
  return out;
}

function makeEl(tag) {
  var e = {
    tagName: tag.toUpperCase(),
    children: [],
    parentNode: null,
    hidden: false,
    value: "",
    id: "",
    type: "",
    checked: false,
    scrollTop: 0,
    scrollLeft: 0,
    clientWidth: 320,
    offsetWidth: 60,
    offsetLeft: 0,
    _attrs: {},
    _classes: new Set(),
    _listeners: {},
    style: { setProperty: function () {} },
    _text: "",
    get textContent() {
      var t = this._text;
      for (var i = 0; i < this.children.length; i++) t += this.children[i].textContent;
      return t;
    },
    set textContent(v) { this._text = v === null || v === undefined ? "" : String(v); this.children = []; },
    set innerHTML(v) { this._text = ""; var sv = makeEl("svg"); if (String(v).indexOf('class="spark"') >= 0) sv.className = "spark"; this.children = [sv]; },
    get firstChild() { return this.children[0] || null; },
    get className() { return Array.from(this._classes).join(" "); },
    set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); },
    classList: null,
    appendChild: function (c) { c.parentNode = this; this.children.push(c); return c; },
    insertBefore: function (c, ref) {
      c.parentNode = this;
      var i = ref ? this.children.indexOf(ref) : 0;
      if (i < 0) i = this.children.length;
      this.children.splice(i, 0, c);
      return c;
    },
    removeChild: function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    remove: function () { if (this.parentNode) this.parentNode.removeChild(this); },
    replaceChild: function (n, o) { var i = this.children.indexOf(o); if (i >= 0) this.children[i] = n; return o; },
    addEventListener: function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
    removeEventListener: function () {},
    setAttribute: function (k, v) { this._attrs[k] = String(v); if (k === "id") this.id = String(v); if (k === "type") this.type = String(v); },
    getAttribute: function (k) { return k in this._attrs ? this._attrs[k] : null; },
    removeAttribute: function (k) { delete this._attrs[k]; },
    querySelector: function (s) { var r = searchAll(this, compileSel(s), []); return r[0] || null; },
    querySelectorAll: function (s) { return searchAll(this, compileSel(s), []); },
    focus: function () {}, select: function () {}, setSelectionRange: function () {},
    click: function () { this._fire("click"); },
    _fire: function (t) {
      var ls = this._listeners[t] || [];
      for (var i = 0; i < ls.length; i++) ls[i].call(this, { type: t, target: this });
    }
  };
  e.classList = {
    add: function () { for (var i = 0; i < arguments.length; i++) e._classes.add(arguments[i]); },
    remove: function () { for (var i = 0; i < arguments.length; i++) e._classes.delete(arguments[i]); },
    toggle: function (c, force) {
      var has = e._classes.has(c);
      var want = force === undefined ? !has : !!force;
      if (want) e._classes.add(c); else e._classes.delete(c);
      return want;
    },
    contains: function (c) { return e._classes.has(c); }
  };
  __all.push(e);
  return e;
}

function makeDoc() {
  var body = makeEl("body");
  var doc = {
    readyState: "complete",
    body: body,
    createElement: function (t) { return makeEl(t); },
    createTextNode: function (t) { var n = makeEl("#text"); n._text = String(t); return n; },
    execCommand: function () { return true; },
    addEventListener: function () {},
    querySelector: function (s) { return searchAll(body, compileSel(s), [])[0] || null; },
    querySelectorAll: function (s) { return searchAll(body, compileSel(s), []); }
  };
  return doc;
}
var document = makeDoc();
var window = { addEventListener: function () {}, scrollTo: function () {} };
var navigator = {};
var FileReader = function () {
  this.onload = null;
  this.onerror = null;
  this.result = "";
  this.readAsText = function (f) {
    this.result = typeof f === "object" && f !== null ? f.__text : String(f);
    if (this.onload) this.onload.call(this);
  };
};

function buildSkeleton(doc) {
  var head = makeEl("div"); head.className = "pagehead";
  var rmJump = makeEl("button"); rmJump.id = "rmJump"; rmJump.type = "button";
  var rmSum = makeEl("b"); rmSum.id = "rmSum"; rmJump.appendChild(rmSum);
  var moreBtn = makeEl("button"); moreBtn.id = "moreBtn"; moreBtn.type = "button";
  head.appendChild(rmJump); head.appendChild(moreBtn);
  doc.body.appendChild(head);

  var sticky = makeEl("header"); sticky.className = "sticky"; sticky.id = "stickyBar";
  var seg = makeEl("div"); seg.id = "progSeg";
  var chips = makeEl("div"); chips.id = "weekChips";
  var daytabs = makeEl("div"); daytabs.id = "dayTabs";
  sticky.appendChild(seg); sticky.appendChild(chips); sticky.appendChild(daytabs);
  doc.body.appendChild(sticky);

  var main = makeEl("main"); main.id = "view";
  var tabTrain = makeEl("section"); tabTrain.id = "tabTrain"; tabTrain.className = "module";
  var dayHead = makeEl("div"); dayHead.id = "dayHead";
  var cards = makeEl("div"); cards.id = "cards";
  var btnCopyWeek = makeEl("button"); btnCopyWeek.id = "btnCopyWeek"; btnCopyWeek.type = "button";
  tabTrain.appendChild(dayHead); tabTrain.appendChild(cards); tabTrain.appendChild(btnCopyWeek);
  main.appendChild(tabTrain);
  var tabDiet = makeEl("section"); tabDiet.id = "tabDiet"; tabDiet.className = "module"; tabDiet.hidden = true;
  var tabCardio = makeEl("section"); tabCardio.id = "tabCardio"; tabCardio.className = "module"; tabCardio.hidden = true;
  var tabWeight = makeEl("section"); tabWeight.id = "tabWeight"; tabWeight.className = "module"; tabWeight.hidden = true;
  main.appendChild(tabDiet); main.appendChild(tabCardio); main.appendChild(tabWeight);
  doc.body.appendChild(main);

  var bnav = makeEl("nav"); bnav.className = "bnav";
  ["train", "diet", "cardio", "weight"].forEach(function (t) {
    var b = makeEl("button"); b.className = "navbtn"; b.type = "button";
    b.setAttribute("data-tab", t);
    b.appendChild(makeEl("span"));
    bnav.appendChild(b);
  });
  doc.body.appendChild(bnav);

  var backdrop = makeEl("div"); backdrop.id = "backdrop";
  doc.body.appendChild(backdrop);

  ["More", "Manual", "Backup"].forEach(function (n) {
    var sh = makeEl("section"); sh.className = "sheet"; sh.id = "sheet" + n;
    var bodyEl = makeEl("div"); bodyEl.className = "sheet-body";
    var x = makeEl("button"); x.className = "sheet-x"; x.type = "button";
    sh.appendChild(x); sh.appendChild(bodyEl);
    doc.body.appendChild(sh);
  });
  var mmManual = makeEl("button"); mmManual.id = "mmManual"; mmManual.type = "button";
  var mmBackup = makeEl("button"); mmBackup.id = "mmBackup"; mmBackup.type = "button";
  doc.querySelector("#sheetMore .sheet-body").appendChild(mmManual);
  doc.querySelector("#sheetMore .sheet-body").appendChild(mmBackup);
  var manualBody = makeEl("div"); manualBody.id = "manualBody";
  doc.querySelector("#sheetManual .sheet-body").appendChild(manualBody);
  var btnExport = makeEl("button"); btnExport.id = "btnExport";
  var btnImport = makeEl("button"); btnImport.id = "btnImport";
  doc.querySelector("#sheetBackup .sheet-body").appendChild(btnExport);
  doc.querySelector("#sheetBackup .sheet-body").appendChild(btnImport);

  var toast = makeEl("div"); toast.id = "toast";
  doc.body.appendChild(toast);
  var fileImport = makeEl("input"); fileImport.id = "fileImport"; fileImport.type = "file";
  doc.body.appendChild(fileImport);
}

buildSkeleton(document);

var DATA = {"programs": [{"intro": {"lines": [{"t": "h", "x": "TSA 9周中级力量举计划 v2.0（中文版）"}, {"t": "h", "x": "出品: The Strength Athlete (Bryce Lewis / Hani Jazayrli) | 数据源自官方 v2.0"}, {"t": "h", "x": "结构: W1-4容量期 → W5减载 → W6-8巅峰期 → W9测试周 | 每周4练: 深蹲2次/卧推3次/硬拉2次(含暂停拉)"}, {"t": "h", "x": "第一步：在下方黄色格填入你的 1RM（kg），全表重量自动计算"}, {"t": "h", "x": "深蹲 1RM (kg)"}, {"t": "p", "x": "210"}, {"t": "p", "x": "减脂期建议输入 = 当前真实极限 × 0.92~0.95，宁轻勿重"}, {"t": "h", "x": "卧推 1RM (kg)"}, {"t": "p", "x": "135"}, {"t": "p", "x": "同上；预填值为示例，按你测试周结果修改"}, {"t": "h", "x": "硬拉 1RM (kg)"}, {"t": "p", "x": "220"}, {"t": "p", "x": "同上"}, {"t": "h", "x": "RPE 对照表"}, {"t": "h", "x": "RPE 10 = 极限，再也做不了1次 | RPE 9 = 还能做1次 | RPE 8 = 还能做2次 | RPE 7 = 还能做3次"}, {"t": "h", "x": "带 RPE 的组不指定重量：选一个做完后余力达标的重量。RPE 单次用爬坡法找：每把涨约5%，RPE逐把+1，到目标RPE为止"}, {"t": "h", "x": "组间休息"}, {"t": "h", "x": "主项顶组 3-5分钟 | 回退组/主项容量组 2-3分钟 | 辅助 60-90秒"}, {"t": "h", "x": "减脂期使用规则（个性化修改，重要）"}, {"t": "h", "x": "1. W6-8 巅峰期顶组 RPE 封顶 8-8.5（原计划的 @9 不做）；W9 第4天不测真极限，改做 RPE 8-9 重单次"}, {"t": "h", "x": "2. 减脂期 1RM 输入值用真实极限的 92-95%，让整个标尺偏轻；两个周期之间不加重"}, {"t": "h", "x": "3. 时间压缩: D3 辅助可砍到2个动作; D2 卧推 W1-4 可由5×4减为4×4"}, {"t": "h", "x": "4. 肩部补充(置换不追加): D3 用站姿实力推 3×5-8 @RPE7 替换腿举; D2 结束加面拉 3×15-20"}, {"t": "h", "x": "5. 警报信号: 同重量 RPE 连续两周明显变重 → 缩减缺口或插入维持周; 力量连降2-3周 → 回检饮食"}, {"t": "h", "x": "各周一览"}, {"t": "h", "x": "W1-4 容量期: 重量每周+2~3%，感觉应该'中等偏轻'，W1如果觉得重说明1RM输高了"}, {"t": "h", "x": "W5 减载: 不许跳过——前4周攒的疲劳靠这周释放，巅峰期才出得来"}, {"t": "h", "x": "W6-8 巅峰期: 顶组按RPE走，回退组按百分比走; W9 测试周: 前两天轻量，第3天休息，第4天测试"}, {"t": "h", "x": "参考: 官方免费页 thestrengthathlete.com/freebies | 介绍 liftvault.com/programs/powerlifting/tsa-9-week-intermediate-program/"}]}, "weeks": [{"n": 1, "title": "第 1 周 — 容量期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×3", "intensity": "80%", "rest": "3分钟", "note": "顶组", "family": "squat", "pct": 80.0, "rpe": false, "orig": "167.5"}, {"name": "杠铃深蹲 Squat", "sets": "3×8", "intensity": "69%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 69.0, "rpe": false, "orig": "145"}, {"name": "卧推 Bench Press", "sets": "3×8", "intensity": "69%", "rest": "2分钟", "note": "", "family": "bench", "pct": 69.0, "rpe": false, "orig": "92.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×6", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "4×5", "intensity": "74%", "rest": "3分钟", "note": "", "family": "dead", "pct": 74.0, "rpe": false, "orig": "162.5"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "72%", "rest": "2分钟", "note": "", "family": "bench", "pct": 72.0, "rpe": false, "orig": "97.5"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×10", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "6×4", "intensity": "73%", "rest": "3分钟", "note": "", "family": "squat", "pct": 73.0, "rpe": false, "orig": "152.5"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 7", "rest": "3分钟", "note": "顶组单次", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 120 kg)"}, {"name": "卧推 Bench Press", "sets": "3×5", "intensity": "77%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 77.0, "rpe": false, "orig": "105"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "4×4", "intensity": "67%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 67.0, "rpe": false, "orig": "147.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×6", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 2, "title": "第 2 周 — 容量期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×3", "intensity": "82%", "rest": "3分钟", "note": "顶组", "family": "squat", "pct": 82.0, "rpe": false, "orig": "172.5"}, {"name": "杠铃深蹲 Squat", "sets": "3×8", "intensity": "71%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 71.0, "rpe": false, "orig": "150"}, {"name": "卧推 Bench Press", "sets": "3×8", "intensity": "71%", "rest": "2分钟", "note": "", "family": "bench", "pct": 71.0, "rpe": false, "orig": "95"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×6", "intensity": "RPE 7.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "5×5", "intensity": "77%", "rest": "3分钟", "note": "", "family": "dead", "pct": 77.0, "rpe": false, "orig": "170"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "74%", "rest": "2分钟", "note": "", "family": "bench", "pct": 74.0, "rpe": false, "orig": "100"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×10", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "6×4", "intensity": "75%", "rest": "3分钟", "note": "", "family": "squat", "pct": 75.0, "rpe": false, "orig": "157.5"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 7.5", "rest": "3分钟", "note": "顶组单次", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 122.5 kg)"}, {"name": "卧推 Bench Press", "sets": "3×5", "intensity": "79%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 79.0, "rpe": false, "orig": "107.5"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "4×4", "intensity": "69%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 69.0, "rpe": false, "orig": "152.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×6", "intensity": "RPE 7.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 3, "title": "第 3 周 — 容量期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×3", "intensity": "84%", "rest": "3分钟", "note": "顶组", "family": "squat", "pct": 84.0, "rpe": false, "orig": "177.5"}, {"name": "杠铃深蹲 Squat", "sets": "3×7", "intensity": "73%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 73.0, "rpe": false, "orig": "152.5"}, {"name": "卧推 Bench Press", "sets": "4×7", "intensity": "73%", "rest": "2分钟", "note": "", "family": "bench", "pct": 73.0, "rpe": false, "orig": "97.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×6", "intensity": "RPE 8", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "5×4", "intensity": "79%", "rest": "3分钟", "note": "", "family": "dead", "pct": 79.0, "rpe": false, "orig": "175"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "76%", "rest": "2分钟", "note": "", "family": "bench", "pct": 76.0, "rpe": false, "orig": "102.5"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "6×4", "intensity": "77%", "rest": "3分钟", "note": "", "family": "squat", "pct": 77.0, "rpe": false, "orig": "162.5"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 8", "rest": "3分钟", "note": "顶组单次", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 125 kg)"}, {"name": "卧推 Bench Press", "sets": "3×5", "intensity": "81%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 81.0, "rpe": false, "orig": "110"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "4×4", "intensity": "71%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 71.0, "rpe": false, "orig": "155"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×6", "intensity": "RPE 8", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 4, "title": "第 4 周 — 容量期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×3", "intensity": "86%", "rest": "3分钟", "note": "顶组", "family": "squat", "pct": 86.0, "rpe": false, "orig": "180"}, {"name": "杠铃深蹲 Squat", "sets": "3×7", "intensity": "75%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 75.0, "rpe": false, "orig": "157.5"}, {"name": "卧推 Bench Press", "sets": "4×7", "intensity": "75%", "rest": "2分钟", "note": "", "family": "bench", "pct": 75.0, "rpe": false, "orig": "102.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×6", "intensity": "RPE 8.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "6×4", "intensity": "81%", "rest": "3分钟", "note": "", "family": "dead", "pct": 81.0, "rpe": false, "orig": "177.5"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "78%", "rest": "2分钟", "note": "", "family": "bench", "pct": 78.0, "rpe": false, "orig": "105"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "6×4", "intensity": "79%", "rest": "3分钟", "note": "", "family": "squat", "pct": 79.0, "rpe": false, "orig": "165"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 8.5", "rest": "3分钟", "note": "顶组单次", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 127.5 kg)"}, {"name": "卧推 Bench Press", "sets": "3×5", "intensity": "84%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 84.0, "rpe": false, "orig": "112.5"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "4×4", "intensity": "73%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 73.0, "rpe": false, "orig": "160"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×6", "intensity": "RPE 8.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 5, "title": "第 5 周 — 减载周", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "3×5", "intensity": "73%", "rest": "3分钟", "note": "", "family": "squat", "pct": 73.0, "rpe": false, "orig": "152.5"}, {"name": "卧推 Bench Press", "sets": "3×6", "intensity": "73%", "rest": "2分钟", "note": "", "family": "bench", "pct": 73.0, "rpe": false, "orig": "97.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "2×5", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "4×3", "intensity": "79%", "rest": "3分钟", "note": "", "family": "dead", "pct": 79.0, "rpe": false, "orig": "175"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "78%", "rest": "2分钟", "note": "", "family": "bench", "pct": 78.0, "rpe": false, "orig": "105"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×10", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "5×4", "intensity": "75%", "rest": "3分钟", "note": "", "family": "squat", "pct": 75.0, "rpe": false, "orig": "157.5"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "3×4", "intensity": "78%", "rest": "3分钟", "note": "", "family": "bench", "pct": 78.0, "rpe": false, "orig": "105"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "4×3", "intensity": "72%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 72.0, "rpe": false, "orig": "157.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "2×5", "intensity": "RPE 8.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 6, "title": "第 6 周 — 巅峰期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×1", "intensity": "RPE 6.5", "rest": "3分钟", "note": "顶组单次", "family": "squat", "pct": null, "rpe": true, "orig": "按RPE自选(约 185 kg)"}, {"name": "杠铃深蹲 Squat", "sets": "5×3", "intensity": "85%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 85.0, "rpe": false, "orig": "177.5"}, {"name": "卧推 Bench Press", "sets": "4×6", "intensity": "75%", "rest": "2分钟", "note": "", "family": "bench", "pct": 75.0, "rpe": false, "orig": "102.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×5", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "1×2", "intensity": "RPE 7", "rest": "3分钟", "note": "顶组", "family": "dead", "pct": null, "rpe": true, "orig": "按RPE自选(约 190 kg)"}, {"name": "硬拉 Deadlift", "sets": "4×3", "intensity": "82%", "rest": "3分钟", "note": "回退组", "family": "dead", "pct": 82.0, "rpe": false, "orig": "180"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "80%", "rest": "2分钟", "note": "", "family": "bench", "pct": 80.0, "rpe": false, "orig": "107.5"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "5×4", "intensity": "76%", "rest": "3分钟", "note": "", "family": "squat", "pct": 76.0, "rpe": false, "orig": "160"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "2×1", "intensity": "RPE 7", "rest": "3分钟", "note": "顶组单次×2", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 120 kg)"}, {"name": "卧推 Bench Press", "sets": "3×4", "intensity": "81%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 81.0, "rpe": false, "orig": "110"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "5×3", "intensity": "74%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 74.0, "rpe": false, "orig": "162.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×5", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 7, "title": "第 7 周 — 巅峰期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×1", "intensity": "RPE 7.5", "rest": "3分钟", "note": "顶组单次", "family": "squat", "pct": null, "rpe": true, "orig": "按RPE自选(约 190 kg)"}, {"name": "杠铃深蹲 Squat", "sets": "5×3", "intensity": "87%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 87.0, "rpe": false, "orig": "182.5"}, {"name": "卧推 Bench Press", "sets": "4×6", "intensity": "77%", "rest": "2分钟", "note": "", "family": "bench", "pct": 77.0, "rpe": false, "orig": "105"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×5", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "1×1", "intensity": "RPE 8", "rest": "3分钟", "note": "顶组单次", "family": "dead", "pct": null, "rpe": true, "orig": "按RPE自选(约 202.5 kg)"}, {"name": "硬拉 Deadlift", "sets": "5×2", "intensity": "84%", "rest": "3分钟", "note": "回退组", "family": "dead", "pct": 84.0, "rpe": false, "orig": "185"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "82%", "rest": "2分钟", "note": "", "family": "bench", "pct": 82.0, "rpe": false, "orig": "110"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "5×3", "intensity": "78%", "rest": "3分钟", "note": "", "family": "squat", "pct": 78.0, "rpe": false, "orig": "165"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "2×1", "intensity": "RPE 8", "rest": "3分钟", "note": "顶组单次×2", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 125 kg)"}, {"name": "卧推 Bench Press", "sets": "3×4", "intensity": "84%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 84.0, "rpe": false, "orig": "112.5"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "5×3", "intensity": "76%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 76.0, "rpe": false, "orig": "167.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×5", "intensity": "RPE 7.5", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 8, "title": "第 8 周 — 巅峰期", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×1", "intensity": "RPE 8.5", "rest": "3分钟", "note": "顶组单次", "family": "squat", "pct": null, "rpe": true, "orig": "按RPE自选(约 197.5 kg)"}, {"name": "杠铃深蹲 Squat", "sets": "5×2", "intensity": "89%", "rest": "3分钟", "note": "回退组", "family": "squat", "pct": 89.0, "rpe": false, "orig": "187.5"}, {"name": "卧推 Bench Press", "sets": "4×5", "intensity": "79%", "rest": "2分钟", "note": "", "family": "bench", "pct": 79.0, "rpe": false, "orig": "107.5"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×5", "intensity": "RPE 7", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "4×10-12", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "硬拉 Deadlift", "sets": "1×1", "intensity": "RPE 8.5", "rest": "3分钟", "note": "顶组单次", "family": "dead", "pct": null, "rpe": true, "orig": "按RPE自选(约 207.5 kg)"}, {"name": "硬拉 Deadlift", "sets": "4×2", "intensity": "86%", "rest": "3分钟", "note": "回退组", "family": "dead", "pct": 86.0, "rpe": false, "orig": "190"}, {"name": "卧推 Bench Press", "sets": "5×3", "intensity": "84%", "rest": "2分钟", "note": "", "family": "bench", "pct": 84.0, "rpe": false, "orig": "112.5"}, {"name": "潘德雷划船 Pendlay Row", "sets": "3×5-7", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "引体向上 Pull-Up", "sets": "3×12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "罗马椅背屈伸 Back Extension", "sets": "3×10-12", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "杠铃深蹲 Squat", "sets": "5×3", "intensity": "80%", "rest": "3分钟", "note": "", "family": "squat", "pct": 80.0, "rpe": false, "orig": "167.5"}, {"name": "哑铃飞鸟 Chest Fly", "sets": "3×8-10", "intensity": "RPE 7", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "腿举 Leg Press", "sets": "3×8-10", "intensity": "RPE 7.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "上斜哑铃划船(胸托) Incline Row", "sets": "3×10-12", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "哑铃侧平举 Lateral Raise", "sets": "3×12-15", "intensity": "RPE 7.5", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 9(减脂期封顶8.5)", "rest": "3分钟", "note": "顶组单次", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选(约 127.5 kg)"}, {"name": "卧推 Bench Press", "sets": "4×3", "intensity": "86%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 86.0, "rpe": false, "orig": "115"}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "5×2", "intensity": "78%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 78.0, "rpe": false, "orig": "172.5"}, {"name": "抬腿卧推(无腿驱动) Legs-Up Bench", "sets": "3×5", "intensity": "RPE 8", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "俯身杠铃划船 Bent-Over Row", "sets": "3×6-8", "intensity": "RPE 8", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "高位下拉 Lat Pulldown", "sets": "3×10-12", "intensity": "RPE 8.5", "rest": "90秒", "note": "", "family": "none", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}, {"n": 9, "title": "第 9 周 — 测试周", "days": [{"title": "第 1 天 — 深蹲(顶组+回退) + 卧推(肌肥大向) — 建议周一", "ex": [{"name": "杠铃深蹲 Squat", "sets": "5×2", "intensity": "80%", "rest": "3分钟", "note": "", "family": "squat", "pct": 80.0, "rpe": false, "orig": "167.5"}, {"name": "卧推 Bench Press", "sets": "5×4", "intensity": "81%", "rest": "2分钟", "note": "", "family": "bench", "pct": 81.0, "rpe": false, "orig": "110"}, {"name": "窄距卧推 Close-Grip Bench", "sets": "3×5", "intensity": "轻重量", "rest": "2分钟", "note": "", "family": "bench", "pct": null, "rpe": false, "orig": ""}, {"name": "暂停硬拉(离地约2.5cm停住) Paused Deadlift", "sets": "5×1", "intensity": "75%(硬拉1RM)", "rest": "3分钟", "note": "", "family": "dead", "pct": 75.0, "rpe": false, "orig": "165"}, {"name": "弹力带反向飞鸟 Band Pull-Apart", "sets": "3×30", "intensity": "", "rest": "60秒", "note": "", "family": "none", "pct": null, "rpe": false, "orig": ""}]}, {"title": "第 2 天 — 硬拉 + 卧推(爆发力向) — 建议周二", "ex": [{"name": "卧推 Bench Press", "sets": "1×1", "intensity": "86%", "rest": "3分钟", "note": "开把练习", "family": "bench", "pct": 86.0, "rpe": false, "orig": "115"}, {"name": "卧推 Bench Press", "sets": "5×3", "intensity": "78%", "rest": "3分钟", "note": "回退组", "family": "bench", "pct": 78.0, "rpe": false, "orig": "105"}]}, {"title": "第 3 天 — 深蹲(容量) + 辅助 — 建议周四", "ex": [{"name": "休息（测试前完全休息日）", "sets": "", "intensity": "", "rest": "", "note": "", "family": "none", "pct": null}]}, {"title": "第 4 天 — 卧推(单次+回退) + 暂停硬拉 — 建议周五", "ex": [{"name": "杠铃深蹲 Squat", "sets": "1×1", "intensity": "RPE 8-9", "rest": "3分钟", "note": "减脂期:加到RPE 8-9重单次即收工,不测真极限", "family": "squat", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "卧推 Bench Press", "sets": "1×1", "intensity": "RPE 8-9", "rest": "3分钟", "note": "同上;非减脂期才按 开把90-92%→95-97%→新PR 流程测试", "family": "bench", "pct": null, "rpe": true, "orig": "按RPE自选"}, {"name": "硬拉 Deadlift", "sets": "1×1", "intensity": "RPE 8-9", "rest": "3分钟", "note": "同上", "family": "dead", "pct": null, "rpe": true, "orig": "按RPE自选"}]}]}], "total": 188, "id": "tsa", "name": "TSA 减脂 9周"}, {"id": "jt20", "name": "JT 2.0 预留", "desc": "增肌块模板预留", "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入"}, {"id": "rippler", "name": "Rippler 预留", "desc": "峰值块模板预留", "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入"}]};

var LS_1RM = "tsa_cut.1rm";
var LS_LOG = "tsa_cut.logs";
var LS_UI = "tsa_cut.ui";
var LS_PROG = "tsa_cut.program";
var LS_CARDIO = "tsa_cut.cardio";
var LS_SLEEP = "tsa_cut.sleep";
var LS_WEIGHT = "tsa_cut.weight";
var DEFAULT_RM = { squat: 205, bench: 135, dead: 212 };
var LIFTS = { squat: "rm-squat", bench: "rm-bench", dead: "rm-dead" };
var LIFT_NAME = { squat: "深蹲", bench: "卧推", dead: "硬拉" };

var SEED_CARDIO = [
  { d: "2026-08-31", t: "跑步", p: 8.5, a: 161, m: 182, f: "正常" },
  { d: "2026-09-01", t: "跑步", p: 8.5, a: 157, m: 175, f: "正常" },
  { d: "2026-09-05", t: "跑步", p: 8.5, a: 154, m: 173, f: "正常" },
  { d: "2026-09-07", t: "跑步", p: 8.6, a: 154, m: 173, f: "更轻松" },
  { d: "2026-09-08", t: "跑步", p: 8.7, a: 152, m: 170, f: "更轻松" }
];
var SEED_SLEEP = [
  { d: "2026-09-07", v: 58 },
  { d: "2026-09-08", v: 54 }
];

var state = {
  logs: {},
  ui: { week: 1, day: 0 },
  program: null,
  tab: "train",
  cardio: [],
  sleep: [],
  weight: [],
  dietDay: 0,
  cdType: "跑步",
  cdFeel: "正常"
};

function $(s, elc) { return (elc || document).querySelector(s); }
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null && text !== "") n.textContent = text;
  return n;
}

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
function saveUI() {
  try { localStorage.setItem(LS_UI, JSON.stringify(state.ui)); } catch (e) {}
}
function loadUI() {
  try {
    var raw = localStorage.getItem(LS_UI);
    if (!raw) return false;
    var v = JSON.parse(raw);
    if (!v) return false;
    if (v.week >= 1 && v.week <= DATA.weeks.length) state.ui.week = v.week;
    else return false;
    if (typeof v.day === "number" && v.day >= 0 && v.day < DATA.weeks[state.ui.week - 1].days.length) state.ui.day = v.day;
    return true;
  } catch (e) { return false; }
}
function inferWeekFromLogs() {
  var mx = 0;
  for (var k in state.logs) {
    var m = /^w(\d+)d/.exec(k);
    if (m) { var w = parseInt(m[1], 10); if (w > mx) mx = w; }
  }
  return mx || 1;
}

function loadJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw) {
      var v = JSON.parse(raw);
      if (v !== null && v !== undefined) return v;
    }
  } catch (e) {}
  return fallback;
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { toast("保存失败：浏览器存储不可用"); }
}

function curProgram() {
  for (var i = 0; i < DATA.programs.length; i++) {
    if (DATA.programs[i].id === state.program) return DATA.programs[i];
  }
  return DATA.programs[0];
}
function bindProgramData() {
  var p = curProgram();
  DATA.weeks = Array.isArray(p.weeks) ? p.weeks : [];
  DATA.intro = p.intro || { lines: [] };
}
function saveProgram() {
  try { localStorage.setItem(LS_PROG, JSON.stringify(state.program)); } catch (e) {}
}
function loadProgram() {
  var id = loadJSON(LS_PROG, null);
  for (var i = 0; i < DATA.programs.length; i++) {
    if (DATA.programs[i].id === id) { state.program = id; return; }
  }
  state.program = DATA.programs[0].id;
}
function seedNewStores() {
  if (localStorage.getItem(LS_CARDIO) === null) saveJSON(LS_CARDIO, SEED_CARDIO);
  if (localStorage.getItem(LS_SLEEP) === null) saveJSON(LS_SLEEP, SEED_SLEEP);
  if (localStorage.getItem(LS_WEIGHT) === null) saveJSON(LS_WEIGHT, []);
}
function loadNewStores() {
  state.cardio = loadJSON(LS_CARDIO, []);
  state.sleep = loadJSON(LS_SLEEP, []);
  state.weight = loadJSON(LS_WEIGHT, []);
  if (!Array.isArray(state.cardio)) state.cardio = [];
  if (!Array.isArray(state.sleep)) state.sleep = [];
  if (!Array.isArray(state.weight)) state.weight = [];
}

function todayISO() {
  var d = new Date();
  var m = d.getMonth() + 1, dd = d.getDate();
  return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (dd < 10 ? "0" + dd : dd);
}
function parseLocalDate(s) {
  if (typeof s !== "string") return null;
  var p = s.split("-");
  if (p.length !== 3) return null;
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d.getTime()) ? null : d;
}
function fmtMD(s) {
  var d = parseLocalDate(s);
  if (!d) return s;
  return (d.getMonth() + 1) + "/" + d.getDate();
}


function logKey(w, d, i) { return "w" + w + "d" + d + "e" + i; }

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

function insertFallbackTA(text) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.className = "fallback-ta";
  var view = $("#view");
  view.insertBefore(ta, view.firstChild);
  ta.focus();
  ta.select();
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
      if (rec.c === "1") line += " ✓完成";
      if (ex.rest) line += " 组间" + ex.rest;
      if (ex.note) line += " 备注:" + ex.note;
      lines.push(line);
    }
  }
  var text = lines.join("\n");
  copyTextCompat(text, function (ok) {
    toast(ok ? ("已复制本周记录（第" + wn + "周）到剪贴板") : "复制失败，请长按下方文本手动复制");
    if (!ok) insertFallbackTA(text);
  });
}

function doExport() {
  var payload = {
    app: "tsa-cut",
    version: 2,
    exportedAt: new Date().toISOString(),
    onerm: get1RM(),
    logs: state.logs,
    cardio: state.cardio,
    sleep: state.sleep,
    weight: state.weight,
    program: state.program
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
    insertFallbackTA(text);
    toast("下载不可用，请手动复制下方JSON文本保存");
  }
}

function doImport(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var obj = JSON.parse(reader.result);
      if (!obj || typeof obj !== "object" ||
          (!obj.logs && !obj.onerm && !obj.cardio && !obj.sleep && !obj.weight && !obj.program)) {
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
      if (Array.isArray(obj.cardio)) {
        state.cardio = obj.cardio;
        saveJSON(LS_CARDIO, state.cardio);
      }
      if (Array.isArray(obj.sleep)) {
        state.sleep = obj.sleep;
        saveJSON(LS_SLEEP, state.sleep);
      }
      if (Array.isArray(obj.weight)) {
        state.weight = obj.weight;
        saveJSON(LS_WEIGHT, state.weight);
      }
      if (typeof obj.program === "string") {
        for (var pi = 0; pi < DATA.programs.length; pi++) {
          if (DATA.programs[pi].id === obj.program) {
            state.program = obj.program;
            saveProgram();
            break;
          }
        }
      }
      bindProgramData();
      refreshAllViews();
      toast("导入成功：1RM 与训练记录已恢复" + (obj.version >= 2 ? "，心肺/睡眠/体重已同步" : "（旧版文件，其余保持本机现状）"));
    } catch (e) {
      toast("导入失败：JSON 解析错误");
    }
  };
  reader.onerror = function () { toast("导入失败：无法读取文件"); };
  reader.readAsText(file);
}


var WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

var MEAL_BENTO = "爱人便当（2掌肉 + 1拳饭 + ≥2拳菜）";
var MEAL_BENTO_K = "1000-1180kcal";
var MEAL_BENTO_P = "蛋白 70-85g";

var MEAL_TPL = {
  1: { slots: [
    { s: "早", t: "果干", k: "~100kcal" },
    { s: "午", t: MEAL_BENTO, k: MEAL_BENTO_K, p: MEAL_BENTO_P },
    { s: "跑后", t: "即食鸡胸 100g", k: "120-130kcal", p: "蛋白 22-26g" },
    { s: "回家", t: "鸡胸肠 120-140g（含+2根补丁）+ 坚果 5-8粒" }
  ] },
  3: { slots: [
    { s: "早", t: "果干", k: "~100kcal" },
    { s: "午", t: MEAL_BENTO, k: MEAL_BENTO_K, p: MEAL_BENTO_P },
    { s: "回家", t: "鸡胸肠 120-140g + 坚果 + 水煮蛋 2枚" }
  ], note: "无晚饭；中午爬楼机，无加餐。" },
  5: { slots: [
    { s: "早", t: "果干", k: "~100kcal" },
    { s: "午", t: MEAL_BENTO, k: MEAL_BENTO_K, p: MEAL_BENTO_P },
    { s: "跑后", t: "不吃鸡胸" },
    { s: "回家", t: "鸡胸肠 80-100g + 坚果" },
    { s: "晚饭", t: "社交晚饭：蛋白件全吃 · 酱料减半 · 酒尽量少" }
  ] },
  6: { slots: [ { s: "周末", t: "周末结构（含一顿cheat）", k: "2600-3000kcal" } ] },
  7: { slots: [ { s: "周末", t: "周末结构（含一顿cheat）", k: "2600-3000kcal" } ] }
};
MEAL_TPL[2] = MEAL_TPL[1];
MEAL_TPL[4] = MEAL_TPL[1];

var DIET_RULES = [
  "便当肉规则：逼过油的肥切 2掌 / 带酱带汁的肥切 1.5掌 / 瘦切 2掌 / 汁不浇饭",
  "训练日 +2根肠补丁：+53kcal / +9.1g 蛋白",
  "坚果 ≤8 粒，数着吃",
  "周均 ~2000-2100kcal → 每月掉 4.5-5% 体重",
  "警报①：体重连续 2 周周均掉 >1.2kg → 加奶或加蛋，不动训练量",
  "警报②：睡眠心率连续 3 天 ≥60 → 同前或跑步改快走",
  "警报③：TSA 连续 3 周重量掉 → 先查便当肉量"
];

var CARDIO_RULE_LINES = [
  "体感=费劲 → 冻结配速",
  "峰值HR ≥175 → 本次降速",
  "末尾连续 ≥2 次均值HR ≤150 → 可提 0.1",
  "均值HR 155-158 且配速较前次上调 → hold 2-3 次",
  "其余 → 维持当前配速"
];

var WEIGHT_RULE_LINES = [
  "按周一~周日自然周汇总周均（看周均不看单日）",
  "掉速换算 %/月 =（本周均 − 上周均）/ 上周均 × 4.33 × 100",
  "警报：连续 2 个完整周每周掉 >1.2kg → 加奶/加蛋, 不动训练量"
];

function phaseOf(t) {
  var i = t.indexOf("—");
  return i >= 0 ? t.slice(i + 1).trim() : "";
}

function dayParts(t) {
  var core = t, wd = "";
  var m = /—\s*建议(周[一二三四五六日])\s*$/.exec(t);
  if (m) { wd = m[1]; core = t.slice(0, m.index).trim(); }
  core = core.replace(/^第\s*\d+\s*天\s*—\s*/, "").trim();
  return { core: core, wd: wd };
}

function renderChips() {
  var strip = $("#weekChips");
  strip.textContent = "";
  DATA.weeks.forEach(function (wk) {
    var c = el("button", "chip" + (wk.n === state.ui.week ? " on" : ""));
    c.type = "button";
    c.setAttribute("role", "tab");
    c.appendChild(el("span", "w", "第" + wk.n + "周"));
    c.appendChild(el("span", "p", phaseOf(wk.title)));
    c.addEventListener("click", function () { selectWeek(wk.n); });
    strip.appendChild(c);
  });
  centerChip();
}

function centerChip() {
  var strip = $("#weekChips");
  var c = strip.querySelector(".chip.on");
  if (!c) return;
  strip.scrollLeft = c.offsetLeft - (strip.clientWidth - c.offsetWidth) / 2;
}

function renderTabs() {
  var days = DATA.weeks[state.ui.week - 1].days;
  if (state.ui.day >= days.length) state.ui.day = 0;
  var box = $("#dayTabs");
  box.textContent = "";
  days.forEach(function (day, d) {
    var p = dayParts(day.title);
    var b = el("button", "dtab" + (d === state.ui.day ? " on" : ""));
    b.type = "button";
    b.setAttribute("role", "tab");
    b.appendChild(el("span", "d", "D" + (d + 1)));
    b.appendChild(el("span", "wd", p.wd || ("第" + (d + 1) + "天")));
    b.addEventListener("click", function () { selectDay(d); });
    box.appendChild(b);
  });
}

function selectWeek(n) {
  if (n === state.ui.week) return;
  state.ui.week = n;
  state.ui.day = 0;
  saveUI();
  renderChips();
  renderTabs();
  renderDay();
  window.scrollTo(0, 0);
}

function selectDay(d) {
  if (d === state.ui.day) return;
  state.ui.day = d;
  saveUI();
  renderTabs();
  renderDay();
  window.scrollTo(0, 0);
}

function bumpWeekIfForward(w) {
  if (w > state.ui.week && w <= DATA.weeks.length) {
    state.ui.week = w;
    saveUI();
    renderChips();
  }
}

function buildProgSeg() {
  var seg = $("#progSeg");
  seg.textContent = "";
  DATA.programs.forEach(function (p) {
    var b = el("button", "segbtn" + (p.id === state.program ? " on" : ""));
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", p.id === state.program ? "true" : "false");
    b.textContent = p.name;
    b.addEventListener("click", function () { selectProgram(p.id); });
    seg.appendChild(b);
  });
}

function selectProgram(id) {
  if (id === state.program) return;
  state.program = id;
  saveProgram();
  bindProgramData();
  if (DATA.weeks.length) {
    if (state.ui.week < 1 || state.ui.week > DATA.weeks.length) { state.ui.week = 1; state.ui.day = 0; }
    if (state.ui.day >= DATA.weeks[state.ui.week - 1].days.length) state.ui.day = 0;
    saveUI();
  }
  buildProgSeg();
  renderProgramView();
}

function renderProgramView() {
  var hasWeeks = DATA.weeks.length > 0;
  $("#weekChips").hidden = !hasWeeks;
  $("#dayTabs").hidden = !hasWeeks;
  $("#dayHead").hidden = !hasWeeks;
  $("#btnCopyWeek").hidden = !hasWeeks;
  if (hasWeeks) {
    if (state.ui.week < 1 || state.ui.week > DATA.weeks.length) { state.ui.week = 1; state.ui.day = 0; }
    renderChips();
    renderTabs();
    renderDay();
  } else {
    $("#dayHead").textContent = "";
    var box = $("#cards");
    box.textContent = "";
    var p = curProgram();
    var card = el("article", "card rest ph");
    card.appendChild(el("h3", "c-name", p.name));
    var heroWrap = el("div", "c-hero");
    var hero = el("div", "hero");
    var num = el("span", "num free", "预留");
    hero.appendChild(num);
    heroWrap.appendChild(hero);
    heroWrap.appendChild(el("div", "hero-sub", p.desc || ""));
    card.appendChild(heroWrap);
    card.appendChild(el("p", "c-note", p.pending || "数据包待生成。"));
    box.appendChild(card);
  }
}

var TABS = ["train", "diet", "cardio", "weight"];
function tabSection(t) { return $("#tab" + t.charAt(0).toUpperCase() + t.slice(1)); }

function setTab(t) {
  if (TABS.indexOf(t) < 0) return;
  state.tab = t;
  closeSheet();
  TABS.forEach(function (id) { tabSection(id).hidden = (id !== t); });
  $("#stickyBar").hidden = (t !== "train");
  document.querySelectorAll(".navbtn").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-tab") === t);
  });
  window.scrollTo(0, 0);
}

function dietWeekdayIndex() {
  var w = new Date().getDay();
  return w === 0 ? 7 : w;
}

function renderDiet() {
  var sec = $("#tabDiet");
  sec.textContent = "";
  var now = new Date();
  var todayIdx = dietWeekdayIndex();
  if (!state.dietDay) state.dietDay = todayIdx;

  sec.appendChild(el("h2", "mhead", "今天吃什么"));
  var subTxt = (now.getMonth() + 1) + "月" + now.getDate() + "日 · " + WEEKDAY_CN[now.getDay()];
  if (state.dietDay !== todayIdx) subTxt = WEEKDAY_CN[state.dietDay % 7] + " · 预览（今天是" + WEEKDAY_CN[now.getDay()] + "）";
  sec.appendChild(el("div", "msub", subTxt));

  var strip = el("div", "wstrip");
  strip.setAttribute("role", "tablist");
  strip.setAttribute("aria-label", "查看一周各天");
  for (var i = 1; i <= 7; i++) {
    (function (idx) {
      var b = el("button", "wday" + (idx === state.dietDay ? " on" : "") + (idx === todayIdx ? " today" : ""));
      b.type = "button";
      b.textContent = WEEKDAY_CN[idx % 7];
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () {
        if (state.dietDay === idx) return;
        state.dietDay = idx;
        renderDiet();
      });
      strip.appendChild(b);
    })(i);
  }
  sec.appendChild(strip);

  var tpl = MEAL_TPL[state.dietDay] || MEAL_TPL[1];
  var cards = el("div", "cards");
  tpl.slots.forEach(function (slot, i) {
    var m = el("article", "meal");
    m.style.setProperty("--i", i);
    m.appendChild(el("span", "slot", slot.s));
    m.appendChild(el("div", "mtext", slot.t));
    if (slot.k || slot.p) {
      var row = el("div", "mrow");
      if (slot.k) row.appendChild(el("span", "mchip", slot.k));
      if (slot.p) row.appendChild(el("span", "chipx", slot.p));
      m.appendChild(row);
    }
    cards.appendChild(m);
  });
  if (tpl.note) {
    var nc = el("article", "meal");
    nc.appendChild(el("div", "mnote", "注：" + tpl.note));
    cards.appendChild(nc);
  }
  sec.appendChild(cards);

  var rules = el("div", "rules");
  rules.appendChild(el("h3", null, "饮食规则 · 三警报"));
  var ul = el("ul");
  DIET_RULES.forEach(function (r, ri) {
    ul.appendChild(el("li", ri >= 4 ? "warn" : null, r));
  });
  rules.appendChild(ul);
  sec.appendChild(rules);

  sec.appendChild(el("div", "modfoot", "模板已锁定：先按这套吃满 2 周，再看周均体重与三警报决定是否调整。"));
}

function cardioAdvice() {
  var arr = state.cardio;
  if (!arr.length) {
    return { lvl: "none", chip: "待记录", why: "先记一两次跑步（配速/心率/体感），规则会自动给出建议。" };
  }
  var last = arr[arr.length - 1];
  if (last.f === "费劲") {
    return { lvl: "freeze", chip: "冻结配速", why: "最近一次体感=费劲 → 不加量，先原地消化。" };
  }
  if (last.m >= 175) {
    return { lvl: "freeze", chip: "本次降速", why: "最近一次峰值HR " + last.m + " ≥175 → 下次配速放慢。" };
  }
  var c = 0;
  for (var i = arr.length - 1; i >= 0 && typeof arr[i].a === "number" && arr[i].a <= 150; i--) c++;
  if (c >= 2) {
    return { lvl: "up", chip: "可提 0.1", why: "末尾连续 " + c + " 次均值HR ≤150 → 配速可提 0.1。" };
  }
  if (arr.length >= 2 && typeof last.a === "number" && last.a >= 155 && last.a <= 158) {
    var prev = arr[arr.length - 2];
    if (typeof last.p === "number" && typeof prev.p === "number" && prev.p < last.p) {
      return { lvl: "hold", chip: "hold 2-3 次", why: "均值HR 155-158 且配速已上调 → 新配速再稳定 2-3 次。" };
    }
  }
  return { lvl: "keep", chip: "维持当前配速", why: "心率与体感均在区间内，按当前配速继续。" };
}

function spark(vals, color) {
  if (!vals.length) return el("div", "msub", "暂无数据");
  var W = 100, H = 36, P = 4;
  var mn = Math.min.apply(null, vals);
  var mx = Math.max.apply(null, vals);
  if (mx === mn) mx = mn + 1;
  var pts = [];
  for (var i = 0; i < vals.length; i++) {
    var x = P + (W - 2 * P) * (i / Math.max(vals.length - 1, 1));
    var y = H - P - (H - 2 * P) * ((vals[i] - mn) / (mx - mn));
    pts.push(x.toFixed(1) + "," + y.toFixed(1));
  }
  var box = el("div");
  box.innerHTML = '<svg class="spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">' +
    '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  return box.firstChild;
}

function sparkCard(title, unit, vals, color) {
  var wrap = el("div", "sparkwrap");
  var cap = el("div", "sparkcap");
  cap.appendChild(document.createTextNode(title + " "));
  var b = el("b", null, (vals.length ? String(Math.round(mnOf(vals))) + " ~ " + String(Math.round(mxOf(vals))) : "–"));
  cap.appendChild(b);
  cap.appendChild(document.createTextNode(" " + unit));
  wrap.appendChild(cap);
  wrap.appendChild(spark(vals, color));
  return wrap;
}
function mnOf(a) { return Math.min.apply(null, a); }
function mxOf(a) { return Math.max.apply(null, a); }

function segRow(options, cur, onPick) {
  var seg = el("div", "seg " + (options.length === 2 ? "c2" : "c3"));
  options.forEach(function (o) {
    var b = el("button", "segbtn" + (o === cur ? " on" : ""));
    b.type = "button";
    b.textContent = o;
    b.addEventListener("click", function () { onPick(o); });
    seg.appendChild(b);
  });
  return seg;
}

function renderCardio() {
  var sec = $("#tabCardio");
  sec.textContent = "";
  sec.appendChild(el("h2", "mhead", "心肺 · 配速阶梯"));
  sec.appendChild(el("div", "msub", "配速为显示值 · 建议由下方规则自动判定"));

  var form = el("article", "card");
  form.appendChild(el("h3", "c-name", "记一次心肺"));

  var f = el("div", "form6");
  var dfg = el("label", "fg c6");
  dfg.appendChild(el("span", null, "日期"));
  var dIn = el("input");
  dIn.type = "date";
  dIn.id = "cdDate";
  dIn.value = todayISO();
  dfg.appendChild(dIn);
  f.appendChild(dfg);

  var tfg = el("div", "fg c6");
  tfg.appendChild(el("span", null, "类型"));
  tfg.appendChild(segRow(["跑步", "爬楼机"], state.cdType, function (v) { state.cdType = v; }));
  f.appendChild(tfg);

  function numFG(label, id, step, ph) {
    var g = el("label", "fg c2");
    g.appendChild(el("span", null, label));
    var inp = el("input");
    inp.type = "number";
    inp.step = step;
    inp.inputMode = "decimal";
    inp.id = id;
    inp.placeholder = ph;
    inp.autocomplete = "off";
    g.appendChild(inp);
    return g;
  }
  f.appendChild(numFG("配速(显示值)", "cdPace", "0.1", "如 8.5"));
  f.appendChild(numFG("均值HR", "cdAvg", "1", "bpm"));
  f.appendChild(numFG("峰值HR", "cdMax", "1", "bpm"));

  var ffg = el("div", "fg c6");
  ffg.appendChild(el("span", null, "体感"));
  ffg.appendChild(segRow(["更轻松", "正常", "费劲"], state.cdFeel, function (v) { state.cdFeel = v; }));
  f.appendChild(ffg);

  form.appendChild(f);
  sec.appendChild(form);

  var save = el("button", "bigbtn dark");
  save.type = "button";
  save.textContent = "记入心肺日志";
  save.addEventListener("click", function () {
    var d = $("#cdDate").value || todayISO();
    var p = parseFloat($("#cdPace").value);
    var a = parseInt($("#cdAvg").value, 10);
    var m = parseInt($("#cdMax").value, 10);
    if (isNaN(a) || isNaN(m) || a <= 0 || m <= 0) { toast("请先填均值与峰值心率"); return; }
    state.cardio.push({ d: d, t: state.cdType, p: isNaN(p) ? null : p, a: a, m: m, f: state.cdFeel });
    saveJSON(LS_CARDIO, state.cardio);
    renderCardio();
    toast("已记入：" + state.cdType + " 均值" + a + " / 峰值" + m);
  });
  sec.appendChild(save);

  var adv = cardioAdvice();
  var ac = el("div", "advice" + (adv.lvl === "up" ? " up" : "") + (adv.lvl === "freeze" ? " freeze" : ""));
  ac.appendChild(el("span", "chipst", adv.chip));
  ac.appendChild(el("div", "why", adv.why));
  sec.appendChild(ac);
  var rl = el("div", "rulelines");
  rl.textContent = "规则：" + CARDIO_RULE_LINES.join(" ｜ ");
  sec.appendChild(rl);

  var avgs = [], maxs = [];
  state.cardio.forEach(function (e) {
    if (typeof e.a === "number") avgs.push(e.a);
    if (typeof e.m === "number") maxs.push(e.m);
  });
  sec.appendChild(sparkCard("均值HR", "bpm · 旧→新", avgs, "#1a1c20"));
  sec.appendChild(sparkCard("峰值HR", "bpm · 旧→新", maxs, "#c2410c"));

  if (state.cardio.length) {
    var list = el("div", "trend");
    for (var i = state.cardio.length - 1; i >= 0; i--) {
      var e = state.cardio[i];
      var r = el("div", "trow");
      r.appendChild(el("span", "td", fmtMD(e.d)));
      r.appendChild(el("span", "tt", e.t || "—"));
      if (typeof e.p === "number") r.appendChild(el("span", "tv", "配速" + e.p));
      r.appendChild(el("span", "tv", "均值" + e.a));
      r.appendChild(el("span", "tv hot", "峰值" + e.m));
      r.appendChild(el("span", "tf" + (e.f === "费劲" ? "" : (e.f === "更轻松" ? " good" : "")), e.f || "—"));
      list.appendChild(r);
    }
    sec.appendChild(list);
  }

  renderSleep(sec);
  sec.appendChild(el("div", "modfoot", "跑步配速阶梯 + 睡眠心率，是饮食三警报②的数据源；连续走高先降强度再动饮食。"));
}

function renderSleep(sec) {
  var card = el("article", "card");
  card.style.borderColor = "var(--line2)";
  card.appendChild(el("h3", "c-name", "睡眠心率（晨起静息）"));

  var chips = el("div", "statchips");
  var last7 = state.sleep.slice(-7);
  var base = last7.length ? Math.min.apply(null, last7.map(function (e) { return e.v; })) : null;
  chips.appendChild(el("span", "mchip", base !== null ? "基线(近7天最低) " + base : "基线 待记录"));
  var last = state.sleep.length ? state.sleep[state.sleep.length - 1] : null;
  if (last) chips.appendChild(el("span", "chipx", "最近 " + fmtMD(last.d) + " · " + last.v));
  card.appendChild(chips);

  var row = el("div", "frow");
  var g = el("label", "fg");
  g.appendChild(el("span", null, "今日晨起心率 bpm"));
  var inp = el("input");
  inp.type = "number";
  inp.step = "1";
  inp.inputMode = "numeric";
  inp.id = "slV";
  inp.placeholder = "如 55";
  inp.autocomplete = "off";
  g.appendChild(inp);
  row.appendChild(g);
  var btn = el("button", "bigbtn dark");
  btn.type = "button";
  btn.style.margin = "0";
  btn.textContent = "记一笔";
  btn.addEventListener("click", function () {
    var v = parseInt($("#slV").value, 10);
    if (isNaN(v) || v <= 0) { toast("请先填晨起心率"); return; }
    state.sleep.push({ d: todayISO(), v: v });
    saveJSON(LS_SLEEP, state.sleep);
    renderCardio();
    toast("已记录睡眠心率 " + v);
  });
  row.appendChild(btn);
  card.appendChild(row);

  if (state.sleep.length) {
    var list = el("div", "trend");
    for (var i = state.sleep.length - 1; i >= 0 && i >= state.sleep.length - 10; i--) {
      var e = state.sleep[i];
      var r = el("div", "trow");
      r.appendChild(el("span", "td", fmtMD(e.d)));
      r.appendChild(el("span", "tv" + (e.v >= 60 ? " hot" : ""), e.v + " bpm"));
      if (e.v >= 63) r.appendChild(el("span", "tf", "单次≥63"));
      else if (e.v >= 60) r.appendChild(el("span", "tf", "偏高"));
      list.appendChild(r);
    }
    card.appendChild(list);
  }
  sec.appendChild(card);

  var alarm = sleepAlarm();
  if (alarm) {
    var a = el("div", "alarm");
    a.appendChild(el("div", "at", "睡眠心率警报"));
    a.appendChild(el("div", "ab", "连续 3 天 ≥60 或单次 ≥63 → 同前（不加上量），或跑步改快走。"));
    sec.appendChild(a);
  }
}

function sleepAlarm() {
  var arr = state.sleep;
  if (!arr.length) return false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].v >= 63) return true;
  }
  if (arr.length >= 3) {
    var n = 0;
    for (var j = arr.length - 1; j >= 0 && arr[j].v >= 60; j--) n++;
    if (n >= 3) return true;
  }
  return false;
}

function weightWeeks() {
  var map = {};
  state.weight.forEach(function (e) {
    var d = parseLocalDate(e.d);
    if (!d || typeof e.v !== "number" || !isFinite(e.v)) return;
    var off = (d.getDay() + 6) % 7;
    var mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - off);
    var key = mon.getFullYear() * 10000 + (mon.getMonth() + 1) * 100 + mon.getDate();
    if (!map[key]) map[key] = { mon: mon, vals: [] };
    map[key].vals.push(e.v);
  });
  var keys = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
  return keys.map(function (k) { return map[k]; });
}

function weekDone(mon) {
  var sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  var t = parseLocalDate(todayISO());
  return sun.getTime() <= t.getTime();
}

function renderWeight() {
  var sec = $("#tabWeight");
  sec.textContent = "";
  sec.appendChild(el("h2", "mhead", "体重 · 看周均"));
  sec.appendChild(el("div", "msub", "每天固定时间称一次 · 看周均不看单日"));

  var form = el("article", "card");
  form.appendChild(el("h3", "c-name", "记一笔体重"));
  var f = el("div", "form6");
  var dfg = el("label", "fg c6");
  dfg.appendChild(el("span", null, "日期"));
  var dIn = el("input");
  dIn.type = "date";
  dIn.id = "wtDate";
  dIn.value = todayISO();
  dfg.appendChild(dIn);
  f.appendChild(dfg);
  var kg = el("label", "fg c2");
  kg.appendChild(el("span", null, "体重 kg"));
  var kIn = el("input");
  kIn.type = "number";
  kIn.step = "0.1";
  kIn.inputMode = "decimal";
  kIn.id = "wtKg";
  kIn.placeholder = "如 79.5";
  kIn.autocomplete = "off";
  kg.appendChild(kIn);
  f.appendChild(kg);
  form.appendChild(f);
  sec.appendChild(form);

  var save = el("button", "bigbtn dark");
  save.type = "button";
  save.textContent = "记入体重";
  save.addEventListener("click", function () {
    var v = parseFloat($("#wtKg").value);
    if (isNaN(v) || v <= 0) { toast("请先填体重 kg"); return; }
    var d = $("#wtDate").value || todayISO();
    state.weight.push({ d: d, v: Math.round(v * 10) / 10 });
    saveJSON(LS_WEIGHT, state.weight);
    renderWeight();
    toast("已记录 " + (Math.round(v * 10) / 10) + " kg");
  });
  sec.appendChild(save);

  if (!state.weight.length) {
    sec.appendChild(el("div", "empty", "秤到货后开始记录；看周均不看单日"));
    sec.appendChild(el("div", "modfoot", "有 7 天数据后自动出周均、周差与掉速 %/月。"));
    return;
  }

  var weeks = weightWeeks();
  var stats = [];
  for (var i = 0; i < weeks.length; i++) {
    var vals = weeks[i].vals;
    var mean = Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 10) / 10;
    var delta = null, rate = null;
    if (i > 0) {
      var pm = stats[i - 1].mean;
      delta = Math.round((mean - pm) * 10) / 10;
      if (pm > 0) rate = (mean - pm) / pm * 4.33 * 100;
    }
    stats.push({ mon: weeks[i].mon, n: vals.length, mean: mean, delta: delta, rate: rate, done: weekDone(weeks[i].mon) });
  }

  var table = el("div", "wtable");
  var hd = el("div", "wrow hd");
  hd.appendChild(el("span", "wl", "周（周一~周日）"));
  hd.appendChild(el("span", "wn", "n"));
  hd.appendChild(el("span", "wm", "周均kg"));
  hd.appendChild(el("span", "wd", "周差"));
  hd.appendChild(el("span", "wr", "掉速"));
  table.appendChild(hd);
  stats.forEach(function (s) {
    var sun = new Date(s.mon.getFullYear(), s.mon.getMonth(), s.mon.getDate() + 6);
    var r = el("div", "wrow");
    r.appendChild(el("span", "wl", fmtMD(dateISO(s.mon)) + " ~ " + fmtMD(dateISO(sun))));
    r.appendChild(el("span", "wn", String(s.n)));
    r.appendChild(el("span", "wm", s.mean.toFixed(1)));
    if (s.delta === null) {
      r.appendChild(el("span", "wd", "—"));
      r.appendChild(el("span", "wr", "—"));
    } else {
      var dDown = s.delta < 0;
      var rDown = s.rate < 0;
      r.appendChild(el("span", "wd " + (dDown ? "down" : "up"),
        (s.delta > 0 ? "+" : "") + s.delta.toFixed(1)));
      r.appendChild(el("span", "wr " + (rDown ? "down" : "up"),
        (rDown ? "↓ " : "↑ ") + (s.rate > 0 ? "+" : "") + s.rate.toFixed(1) + "%/月"));
    }
    table.appendChild(r);
  });
  sec.appendChild(table);

  var alarmed = false;
  for (var k = 1; k < stats.length; k++) {
    if (!stats[k].done || !stats[k - 1].done) continue;
    var gapDays = Math.round((stats[k].mon.getTime() - stats[k - 1].mon.getTime()) / 86400000);
    if (gapDays !== 7) continue;
    if (stats[k].delta !== null && stats[k].delta < -1.2 &&
        stats[k - 1].delta !== null && stats[k - 1].delta < -1.2) {
      alarmed = true;
      break;
    }
  }
  if (alarmed) {
    var a = el("div", "alarm");
    a.appendChild(el("div", "at", "体重警报"));
    a.appendChild(el("div", "ab", "连续 2 周周均掉 >1.2kg → 加奶/加蛋, 不动训练量。"));
    sec.appendChild(a);
  }

  sec.appendChild(el("div", "modfoot", WEIGHT_RULE_LINES.join(" ｜ ")));
}

function dateISO(d) {
  var m = d.getMonth() + 1, dd = d.getDate();
  return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (dd < 10 ? "0" + dd : dd);
}

function updateProgress() {
  var wk = DATA.weeks[state.ui.week - 1];
  var day = wk.days[state.ui.day];
  var total = 0, done = 0;
  for (var i = 0; i < day.ex.length; i++) {
    if (/^休息/.test(day.ex[i].name)) continue;
    total++;
    var rec = state.logs[logKey(wk.n, state.ui.day, i)] || {};
    if (rec.c === "1") done++;
  }
  var pr = $("#dayHead").querySelector(".prog");
  if (!pr) return;
  if (total === 0) { pr.remove(); return; }
  pr.textContent = done + "/" + total;
  pr.title = "已完成 " + done + " / " + total + " 个动作";
  pr.classList.toggle("done", done >= total);
}

function renderDay() {
  var wk = DATA.weeks[state.ui.week - 1];
  var day = wk.days[state.ui.day];
  var p = dayParts(day.title);
  var dh = $("#dayHead");
  dh.textContent = "";
  dh.appendChild(el("div", "core", p.core));
  var total = 0;
  for (var i = 0; i < day.ex.length; i++) {
    if (!/^休息/.test(day.ex[i].name)) total++;
  }
  if (total > 0) dh.appendChild(el("span", "prog", "0/" + total));
  var box = $("#cards");
  box.textContent = "";
  for (var j = 0; j < day.ex.length; j++) {
    box.appendChild(buildCard(day.ex[j], wk.n, state.ui.day, j));
  }
  updateProgress();
}

function buildCard(ex, w, d, i) {
  var isRest = /^休息/.test(ex.name);
  var fam = (ex.family && ex.family !== "none") ? ex.family : "";
  var card = el("article", "card" + (fam ? " " + fam : "") + (isRest ? " rest" : ""));
  card.style.setProperty("--i", i);

  var head = el("div", "c-head");
  head.appendChild(el("h3", "c-name", ex.name));
  if (ex.note && /^(顶组|回退组|顶组单次|开把练习)/.test(ex.note)) {
    head.appendChild(el("span", "tag", ex.note));
  }
  card.appendChild(head);

  var rm = get1RM();
  var wv = computeWeight(ex, rm);

  if (!isRest) {
    var heroWrap = el("div", "c-hero");
    var hero = el("div", "hero");
    var num = el("span", "num");
    var sub;
    if (wv !== null) {
      num.textContent = numFmt(wv);
      hero.appendChild(num);
      hero.appendChild(el("span", "unit", "kg"));
      sub = el("div", "hero-sub", LIFT_NAME[ex.family] + " 1RM " + numFmt(rm[ex.family]) + " × " + ex.pct + "%");
    } else if (ex.pct && ex.family && ex.family !== "none") {
      num.className = "num free";
      num.textContent = ex.intensity || (ex.pct + "%");
      hero.appendChild(num);
      sub = el("button", "hero-sub warn-missing", "未填" + LIFT_NAME[ex.family] + "1RM · 点击去填写");
      sub.type = "button";
      sub.addEventListener("click", function () { openManual(true); });
    } else if (ex.intensity) {
      num.className = "num free";
      num.textContent = ex.intensity;
      hero.appendChild(num);
      if (/^RPE/.test(ex.intensity)) hero.appendChild(el("span", "unit", "上限"));
      sub = el("div", "hero-sub", "自选重量" + (ex.rpe ? " · 做到该RPE即停" : ""));
    } else {
      num.className = "num free";
      num.textContent = "自选";
      hero.appendChild(num);
      sub = el("div", "hero-sub", "自选重量");
    }
    heroWrap.appendChild(hero);
    heroWrap.appendChild(sub);
    card.appendChild(heroWrap);
  }

  var chipRow = el("div", "chips-row");
  if (ex.sets) chipRow.appendChild(el("span", "mchip", ex.sets));
  if (ex.intensity) {
    chipRow.appendChild(el("span", "chipx" + (ex.rpe ? " cap" : ""), (ex.rpe ? "上限 " : "") + ex.intensity));
  }
  if (ex.rest) chipRow.appendChild(el("span", "chipx", "组间 " + ex.rest));
  if (chipRow.firstChild) card.appendChild(chipRow);

  if (ex.orig && ex.orig !== "" && ex.orig !== "按RPE自选") {
    var otext = /^按RPE自选/.test(ex.orig)
      ? ("原表参考：" + ex.orig)
      : ("原表参考：" + ex.orig + "（按原表示例 1RM 计算）");
    card.appendChild(el("p", "orig", otext));
  }

  if (ex.note && !/^(顶组|回退组|顶组单次|开把练习)/.test(ex.note)) {
    card.appendChild(el("p", "c-note", "备注：" + ex.note));
  }

  if (!isRest) {
    var key = logKey(w, d, i);
    var rec = state.logs[key] || {};
    var row = el("div", "logrow");

    function mk(label, field, ph, step) {
      var box = el("label", "lg");
      box.appendChild(el("span", null, label));
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
        bumpWeekIfForward(w);
      });
      box.appendChild(inp);
      return box;
    }

    var wph = wv !== null ? String(numFmt(wv)) : "";
    row.appendChild(mk("重量kg", "w", wph, "2.5"));
    row.appendChild(mk("次数", "r", ex.sets ? ex.sets.split("×").pop() : "", "1"));
    row.appendChild(mk("RPE", "p", "", "0.5"));

    var ck = el("label", "lg check");
    var cb = el("input");
    cb.type = "checkbox";
    if (rec.c === "1") { cb.checked = true; card.classList.add("done"); }
    cb.addEventListener("change", function () {
      var cur = state.logs[key] || {};
      if (cb.checked) cur.c = "1";
      else delete cur.c;
      if (Object.keys(cur).length === 0) delete state.logs[key];
      else state.logs[key] = cur;
      saveLogs();
      card.classList.toggle("done", cb.checked);
      updateProgress();
      bumpWeekIfForward(w);
    });
    ck.appendChild(el("span", null, "完成"));
    ck.appendChild(cb);
    row.appendChild(ck);

    card.appendChild(row);
  }

  return card;
}

function buildManual() {
  var body = $("#manualBody");
  body.textContent = "";
  var L = DATA.programs[0].intro.lines;

  function sec(title, open) {
    var s = el("div", "msec" + (open ? " open" : ""));
    var h = el("button", "msec-h");
    h.type = "button";
    h.appendChild(el("span", null, title));
    h.appendChild(el("span", "chev", "▶"));
    h.addEventListener("click", function () { s.classList.toggle("open"); });
    var b = el("div", "msec-b");
    s.appendChild(h);
    s.appendChild(b);
    body.appendChild(s);
    return b;
  }
  function p(t, cls) { return el("p", cls || null, t); }

  var b1 = sec("1RM 设置", true);
  b1.appendChild(p(L[3].x));
  rmRow(b1, "rm-squat", L[4].x, L[5].x, L[6].x);
  rmRow(b1, "rm-bench", L[7].x, L[8].x, L[9].x);
  rmRow(b1, "rm-dead", L[10].x, L[11].x, L[12].x);

  var b2 = sec(L[13].x);
  b2.appendChild(p(L[14].x));
  b2.appendChild(p(L[15].x));

  var b3 = sec(L[16].x);
  b3.appendChild(p(L[17].x));

  var b4 = sec(L[18].x);
  for (var i = 19; i <= 23; i++) b4.appendChild(p(L[i].x, i === 23 ? "warn" : null));

  var b5 = sec(L[24].x);
  for (var j = 25; j <= 27; j++) b5.appendChild(p(L[j].x));

  var b6 = sec("计划信息与来源");
  b6.appendChild(p(L[0].x, "plain"));
  b6.appendChild(p(L[1].x, "plain"));
  b6.appendChild(p(L[2].x, "plain"));
  b6.appendChild(p(L[28].x, "plain"));

  var b7 = sec("饮食模板与规则");
  b7.appendChild(p("周一/二/四：早·果干 ~100kcal ｜ 午·爱人便当(2掌肉+1拳饭+≥2拳菜) 1000-1180kcal 蛋白70-85g ｜ 跑后·即食鸡胸100g 120-130kcal 22-26g ｜ 回家·鸡胸肠120-140g(含+2根补丁)+坚果5-8粒"));
  b7.appendChild(p("周三：早·果干 ｜ 午·便当 ｜ 回家·肠120-140g+坚果+水煮蛋2枚 ｜ 注：无晚饭；中午爬楼机无加餐"));
  b7.appendChild(p("周五：早·果干 ｜ 午·便当 ｜ 跑后不吃鸡胸 ｜ 回家·肠80-100g+坚果 ｜ 社交晚饭：蛋白件全吃·酱料减半·酒尽量少"));
  b7.appendChild(p("周六/日：周末结构(含一顿cheat) 2600-3000kcal"));
  DIET_RULES.forEach(function (r, ri) { b7.appendChild(p(r, ri >= 4 ? "warn" : null)); });

  var b8 = sec("心肺阶梯与睡眠心率警报");
  CARDIO_RULE_LINES.forEach(function (r) { b8.appendChild(p("· " + r)); });
  b8.appendChild(p("睡眠心率警报：连续 3 天 ≥60 或单次 ≥63 → 同前（不加上量），或跑步改快走。基线 = 近 7 天最低值。", "warn"));

  var b9 = sec("体重警报");
  WEIGHT_RULE_LINES.forEach(function (r) { b9.appendChild(p(r, /警报/.test(r) ? "warn" : null)); });
}

function rmRow(box, id, labelText, sample, hint) {
  var key = id.slice(3);
  var r = el("div", "rmrow");
  var lb = el("label");
  lb.htmlFor = id;
  lb.appendChild(el("span", "lb", labelText));
  lb.appendChild(el("span", "cap", "原表示例 " + sample));
  r.appendChild(lb);
  var inp = el("input");
  inp.type = "number";
  inp.step = "2.5";
  inp.min = "0";
  inp.inputMode = "decimal";
  inp.id = id;
  inp.autocomplete = "off";
  inp.value = DEFAULT_RM[key];
  inp.addEventListener("input", function () {
    save1RM();
    renderDay();
    updateRmSum();
  });
  r.appendChild(inp);
  r.appendChild(el("div", "hint", hint));
  box.appendChild(r);
}

function updateRmSum() {
  var rm = get1RM();
  $("#rmSum").textContent = "蹲" + numFmt(rm.squat) + " 卧" + numFmt(rm.bench) + " 拉" + numFmt(rm.dead);
}

function refreshAllViews() {
  bindProgramData();
  buildProgSeg();
  renderProgramView();
  updateRmSum();
  renderDiet();
  renderCardio();
  renderWeight();
}

var SHEETS = ["More", "Manual", "Backup"];
function openSheet(which) {
  var target = null;
  SHEETS.forEach(function (n) {
    var sh = $("#sheet" + n);
    var isSel = n.toLowerCase() === which;
    sh.classList.toggle("open", isSel);
    if (isSel) target = sh;
  });
  $("#backdrop").classList.toggle("show", !!target);
}

function closeSheet() {
  SHEETS.forEach(function (n) { $("#sheet" + n).classList.remove("open"); });
  $("#backdrop").classList.remove("show");
}

function openManual(focus1RM) {
  openSheet("manual");
  if (focus1RM) {
    var first = $("#manualBody").querySelector(".msec");
    if (first) first.classList.add("open");
  }
  $("#sheetManual").querySelector(".sheet-body").scrollTop = 0;
}

function init() {
  loadProgram();
  bindProgramData();
  buildManual();
  load1RM();
  loadLogs();
  seedNewStores();
  loadNewStores();
  if (!loadUI()) {
    state.ui.week = inferWeekFromLogs();
    state.ui.day = 0;
  }
  state.dietDay = dietWeekdayIndex();
  buildProgSeg();
  renderProgramView();
  updateRmSum();
  renderDiet();
  renderCardio();
  renderWeight();
  setTab("train");

  document.querySelectorAll(".navbtn").forEach(function (b) {
    b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
  });
  $("#moreBtn").addEventListener("click", function () { openSheet("more"); });
  $("#mmManual").addEventListener("click", function () { openManual(false); });
  $("#mmBackup").addEventListener("click", function () { openSheet("backup"); });
  $("#rmJump").addEventListener("click", function () { openManual(true); });
  $("#btnCopyWeek").addEventListener("click", function () {
    if (DATA.weeks.length) copyWeek(state.ui.week);
  });
  $("#backdrop").addEventListener("click", closeSheet);
  document.querySelectorAll(".sheet-x").forEach(function (b) {
    b.addEventListener("click", closeSheet);
  });
  $("#btnExport").addEventListener("click", doExport);
  $("#btnImport").addEventListener("click", function () { $("#fileImport").click(); });
  $("#fileImport").addEventListener("change", function () {
    if (this.files && this.files[0]) doImport(this.files[0]);
    this.value = "";
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();



function lastToast() { return document.querySelector("#toast").textContent; }
function ok(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + name);
  if (!cond) process.exitCode = 1;
}

ok("init rendered week chips", document.querySelectorAll("#weekChips .chip").length === 9);
ok("init rendered day tabs", document.querySelectorAll("#dayTabs .dtab").length === 4);
ok("init rendered exercise cards", document.querySelectorAll("#cards .card").length === 6);
ok("manual has 1RM section", !!document.querySelector("#manualBody .msec"));
ok("manual has v3 sections", document.querySelectorAll("#manualBody .msec").length >= 9);
ok("seeded cardio (5)", state.cardio.length === 5);
ok("seeded sleep (2)", state.sleep.length === 2);
ok("diet default = today", state.dietDay === 3);
ok("program default", state.program === "tsa");

var adv0 = cardioAdvice();
ok("advisor seed -> 维持当前配速", adv0.chip === "维持当前配速");

setTab("diet");
ok("diet tab visible", document.querySelector("#tabDiet").hidden === false);
ok("diet tab title", document.querySelector("#tabDiet .mhead").textContent.indexOf("今天吃什么") >= 0);
ok("diet week strip 7", document.querySelectorAll("#tabDiet .wday").length === 7);
ok("diet today chip on", document.querySelector("#tabDiet .wday.on").textContent === "周三");
var mealCards = document.querySelectorAll("#tabDiet .meal");
ok("周三 3 slots + note", mealCards.length === 4);
ok("周三 note present", mealCards[3].textContent.indexOf("无晚饭") >= 0);

var strip = document.querySelectorAll("#tabDiet .wday");
strip[4]._fire("click");
var mealFri = document.querySelectorAll("#tabDiet .meal");
ok("周五 5 slots", mealFri.length === 5);
ok("周五 社交晚饭", mealFri[4].textContent.indexOf("社交晚饭") >= 0);
strip[5]._fire("click");
ok("周六 周末 cheat", document.querySelector("#tabDiet .meal").textContent.indexOf("cheat") >= 0);
ok("diet rules card", document.querySelectorAll("#tabDiet .rules li").length === 7);

setTab("cardio");
ok("cardio tab visible", document.querySelector("#tabCardio").hidden === false);
ok("cardio form inputs", !!document.querySelector("#cdPace") && !!document.querySelector("#cdAvg") && !!document.querySelector("#cdMax"));
ok("sparklines built", document.querySelectorAll("#tabCardio svg.spark").length === 2);
ok("trend rows newest first", document.querySelectorAll("#tabCardio .trow")[0].textContent.indexOf("9/8") >= 0);
ok("sleep baseline chip", document.querySelector("#tabCardio .statchips .mchip").textContent.indexOf("54") >= 0);
ok("no sleep alarm at seed", !document.querySelector("#tabCardio .alarm"));

document.querySelector("#cdPace").value = "8.8";
document.querySelector("#cdAvg").value = "149";
document.querySelector("#cdMax").value = "168";
var saveBtn = null;
document.querySelectorAll("#tabCardio .bigbtn").forEach(function (b) { if (b.textContent.indexOf("记入心肺日志") >= 0) saveBtn = b; });
saveBtn._fire("click");
ok("cardio appended", state.cardio.length === 6);
var adv1 = cardioAdvice();
ok("advisor 1x avg<=150 -> hold? 维持", adv1.chip === "维持当前配速" || adv1.chip.indexOf("hold") >= 0);
document.querySelector("#cdAvg").value = "148";
document.querySelector("#cdMax").value = "166";
saveBtn = null;
document.querySelectorAll("#tabCardio .bigbtn").forEach(function (b) { if (b.textContent.indexOf("记入心肺日志") >= 0) saveBtn = b; });
saveBtn._fire("click");
var adv2 = cardioAdvice();
ok("advisor 2x avg<=150 -> 可提 0.1", adv2.chip === "可提 0.1");

state.cardio.push({ d: "2026-09-10", t: "跑步", p: 8.5, a: 160, m: 182, f: "费劲" });
ok("advisor 费劲 -> 冻结配速", cardioAdvice().chip === "冻结配速");
state.cardio.pop();
state.cardio.push({ d: "2026-09-10", t: "跑步", p: 8.5, a: 156, m: 178, f: "正常" });
ok("advisor max>=175 -> 本次降速", cardioAdvice().chip === "本次降速");
state.cardio.pop();

document.querySelector("#slV").value = "63";
var slBtn = null;
document.querySelectorAll("#tabCardio .bigbtn").forEach(function (b) { if (b.textContent.indexOf("记一笔") >= 0) slBtn = b; });
slBtn._fire("click");
ok("sleep alarm single>=63", !!document.querySelector("#tabCardio .alarm"));

setTab("weight");
ok("weight tab visible", document.querySelector("#tabWeight").hidden === false);
ok("weight empty state", document.querySelector("#tabWeight .empty").textContent.indexOf("秤到货后开始记录") >= 0);

state.weight = [
  { d: "2026-08-24", v: 82.0 }, { d: "2026-08-25", v: 81.6 },
  { d: "2026-08-31", v: 81.2 }, { d: "2026-09-01", v: 80.9 },
  { d: "2026-09-07", v: 80.6 }, { d: "2026-09-08", v: 80.1 }
];
renderWeight();
var rows = document.querySelectorAll("#tabWeight .wrow");
ok("weight weeks grouped (3)", rows.length === 4);
ok("weight week1 mean 81.8", rows[1].querySelector(".wm").textContent === "81.8");
ok("weight week2 mean 81.1 delta -0.7", rows[2].querySelector(".wm").textContent === "81.1" && rows[2].querySelector(".wd").textContent === "-0.7");
ok("weight rate formatted", /-3\.7%\/月|-3\.8%\/月/.test(rows[2].querySelector(".wr").textContent));
ok("week3 drop >1.2 no alarm yet (only 1 big drop)", !document.querySelector("#tabWeight .alarm"));
state.weight = [
  { d: "2026-08-17", v: 82.0 }, { d: "2026-08-18", v: 82.0 },
  { d: "2026-08-24", v: 80.6 }, { d: "2026-08-25", v: 80.4 },
  { d: "2026-08-31", v: 79.2 }, { d: "2026-09-01", v: 79.2 }
];
renderWeight();
ok("2 consecutive >1.2 drops -> alarm", !!document.querySelector("#tabWeight .alarm"));
ok("alarm text", document.querySelector("#tabWeight .alarm").textContent.indexOf("加奶/加蛋, 不动训练量") >= 0);

setTab("train");
ok("train tab visible again", document.querySelector("#tabTrain").hidden === false);
ok("sticky visible on train", document.querySelector("#stickyBar").hidden === false);

selectProgram("jt20");
ok("program switched jt20", state.program === "jt20");
ok("week chips hidden", document.querySelector("#weekChips").hidden === true);
ok("placeholder card", document.querySelector("#cards .ph").textContent.indexOf("增肌块模板预留") >= 0);
ok("placeholder pending line", document.querySelector("#cards .ph").textContent.indexOf("数据包待生成") >= 0);
selectProgram("rippler");
ok("placeholder rippler", document.querySelector("#cards .ph").textContent.indexOf("峰值块模板预留") >= 0);
selectProgram("tsa");
ok("back to tsa chips visible", document.querySelector("#weekChips").hidden === false);
ok("back to tsa cards", document.querySelectorAll("#cards .card").length === 6);
ok("program persisted", JSON.parse(localStorage.getItem("tsa_cut.program")) === "tsa");

var prevLogs = JSON.stringify(state.logs);
state.logs["w1d0e0"] = { w: "100", r: "5", p: "8", c: "1" };
var wk1 = state.logs["w1d0e0"];
copyWeek(1);
ok("copy toast contains 复制本周记录", lastToast().indexOf("复制本周记录") >= 0);
delete state.logs["w1d0e0"];

var v1file = { __text: JSON.stringify({ app: "tsa-cut", version: 1, exportedAt: "x", onerm: { squat: 190, bench: 125, dead: 200 }, logs: { w1d0e0: { w: "90" } } }) };
doImport(v1file);
ok("v1 import ok", state.logs["w1d0e0"] && state.logs["w1d0e0"].w === "90");
ok("v1 import keeps cardio", state.cardio.length === 7);
ok("v1 import sets 1RM", String(document.querySelector("#rm-squat").value) === "190");

var v2file = { __text: JSON.stringify({ app: "tsa-cut", version: 2, exportedAt: "x", onerm: { squat: 200, bench: 130, dead: 210 }, logs: {}, cardio: [{ d: "2026-09-02", t: "跑步", p: 8.4, a: 150, m: 168, f: "正常" }], sleep: [{ d: "2026-09-02", v: 57 }], weight: [{ d: "2026-09-02", v: 80.4 }], program: "jt20" }) };
doImport(v2file);
ok("v2 import cardio", state.cardio.length === 1 && state.cardio[0].a === 150);
ok("v2 import sleep", state.sleep.length === 1);
ok("v2 import weight", state.weight.length === 1);
ok("v2 import program", state.program === "jt20");
ok("v2 import 1RM", String(document.querySelector("#rm-squat").value) === "200");
ok("after import program view", document.querySelector("#weekChips").hidden === true);

var badFile = { __text: "{not json" };
doImport(badFile);
ok("bad import rejected", lastToast().indexOf("导入失败") >= 0);

state.cardio = [
  { d: "2026-09-01", t: "跑步", p: 8.5, a: 157, m: 170, f: "正常" },
  { d: "2026-09-02", t: "跑步", p: 8.7, a: 156, m: 170, f: "正常" }
];
ok("advisor 155-158 + pace raised -> hold", cardioAdvice().chip === "hold 2-3 次");

state.weight = [
  { d: "2026-08-24", v: 82.0 }, { d: "2026-08-25", v: 82.0 },
  { d: "2026-08-31", v: 80.5 }, { d: "2026-09-01", v: 80.3 },
  { d: "2026-09-07", v: 79.0 }, { d: "2026-09-08", v: 78.8 }
];
renderWeight();
ok("in-progress week excluded from alarm", !document.querySelector("#tabWeight .alarm"));

console.log("--- keys:", Array.from(__store.keys()).sort().join(", "));
