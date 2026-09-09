import json

SRC = "/tmp/opencode"

tsa = json.load(open(SRC + "/tsa_data.json", encoding="utf-8"))
tsa_prog = dict(tsa)
tsa_prog["id"] = "tsa"
tsa_prog["name"] = "TSA 减脂 9周"
programs = [
    tsa_prog,
    {"id": "jt20", "name": "JT 2.0 预留", "desc": "增肌块模板预留", "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入"},
    {"id": "rippler", "name": "Rippler 预留", "desc": "峰值块模板预留", "pending": "数据包待生成：减脂结束测试新 1RM 后自动接入"},
]
js_data = json.dumps({"programs": programs}, ensure_ascii=False).replace("</", "<\\/")

core = open(SRC + "/v3/app_core.js", encoding="utf-8").read()
ui = open(SRC + "/v3/app_ui.js", encoding="utf-8").read()

STUB = r'''
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
'''

DRIVER = r'''
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
'''

harness = (
    STUB
    + "\nvar DATA = " + js_data + ";\n\n"
    + core + "\n\n"
    + ui + "\n\n"
    + DRIVER
)

open(SRC + "/v3/_harness.js", "w", encoding="utf-8").write(harness)
print("harness written")
