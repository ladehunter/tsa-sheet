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
