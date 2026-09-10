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
  { d: "2026-08-31", t: "跑步", p: 7.0, a: 161, m: 182, f: "正常" },
  { d: "2026-09-01", t: "跑步", p: 7.0, a: 157, m: 175, f: "正常" },
  { d: "2026-09-05", t: "跑步", p: 7.0, a: 154, m: 173, f: "正常" },
  { d: "2026-09-07", t: "跑步", p: 7.1, a: 154, m: 173, f: "更轻松" },
  { d: "2026-09-08", t: "跑步", p: 7.1, a: 152, m: 170, f: "更轻松" }
];
var OLD_SEED_SIG = "8.5,8.5,8.5,8.6,8.7|161,157,154,154,152";
function cardioSig(arr) {
  if (!arr || arr.length !== 5) return "";
  return arr.map(function (x) { return x.p; }).join(",") + "|" + arr.map(function (x) { return x.a; }).join(",");
}
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
  else if (cardioSig(loadJSON(LS_CARDIO, [])) === OLD_SEED_SIG) saveJSON(LS_CARDIO, SEED_CARDIO);
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
