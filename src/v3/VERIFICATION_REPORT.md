# TSA 减脂教练 v3 — 验证报告

生成时间: 2026-09-09
产物: `/home/haoluo/tsa_pwa/index.html` (v3, 138,133 字节)
生成器: `/tmp/opencode/build_html_v3.py`（split 源: `/tmp/opencode/v3/{style.css, body.html, app_core.js, app_ui.js}`，运行时测试: `harness.py`/`_harness.js`，浏览器测试: `browser_check.py`）

## ACCEPTANCE

### (a) grep on new index.html
| 项 | 次数 | 要求 | 结果 |
|---|---|---|---|
| 减脂期使用规则 | 1 | ≥1 | ✓ |
| RPE 对照表 | 1 | ≥1 | ✓ |
| 警报信号 | 2 | ≥1 | ✓ |
| 复制本周记录 | 2（按钮文字 + toast 文案） | ≥1 | ✓ |
| 导入 | 7 | ≥1 | ✓ |
| external `https?://` | 0 | =0 | ✓ |

说明: v2 的 SVG favicon 含 1 处 `http://www.w3.org/2000/svg`（xmlns 命名空间，非网络请求）。v3 改用纯 Python 生成的 PNG data-URI 图标（深色底 + 橙角 + 杠铃），外部 URL 计数归零。

### (b) 嵌入 TSA DATA 与 v2 逐字段深度相等
- Python 提取两版 `var DATA = {...}` 并解析。
- v3 结构: `DATA.programs = [TSA, JT2.0, Rippler]`；TSA 项 = v2 全量 DATA + `id`/`name`。
- 去掉 `id`/`name` 后与 v2 DATA（intro / weeks / total）**深度相等: True**（intro ✓ / 9 周 weeks ✓ / total ✓）。未改动任何重量、%、动作、备注。

### (c) 动作数
**188**（生成器与解析出的 JSON 双重统计，与 v2 一致：22+22+22+22+20+23+23+23+11）。

### (d) 文件大小
- v2 备份 `index_v2_backup.html`: **94,788 字节** (92.6 KB)
- v3 `index.html`: **138,133 字节** (134.9 KB)，+43,345 字节（3 新模块 + 计划切换 + 手册新章节）

### (e) v3 源码中的 localStorage 键
- v2 原有（未动，形状一致）: `tsa_cut.1rm`, `tsa_cut.logs`, `tsa_cut.ui`
- 新增（只增）: `tsa_cut.cardio`, `tsa_cut.sleep`, `tsa_cut.weight`, `tsa_cut.program`
- 删除: 无。`logKey`("wNdNeN") 与记录字段 w/r/p/c("1") 与 v2 逐字一致（diff 验证）。

### (f) 布局树（6 行，360px 实测 DOM）
```
body
├─ div.pagehead (logo · brand 减脂教练 · #rmJump 1RM(44px) · #moreBtn ⋯(44px))
├─ header#stickyBar → #progSeg(3 segbtn 计划切换) + #weekChips(9 chip) + #dayTabs(4 dtab)
├─ main#view → #tabTrain(dayhead + cards[6 ex-card] + #btnCopyWeek + foot)
│    + #tabDiet(mhead 今天吃什么 + wstrip[7 wday] + meal 卡 + rules)
│    + #tabCardio(form6 表单 + advice + 2×sparkwrap + trend + 睡眠心率 card + alarm)
│    + #tabWeight(form6 + bigbtn + empty/wtable + alarm + modfoot)
├─ nav#bnav → 4 navbtn（训练/饮食/心肺/体重，糖果纹顶边）
├─ section.sheet ×3 → #sheetMore(手册/备份入口) · #sheetManual(9 msec 含新 3 章) · #sheetBackup(导出/导入)
└─ #toast + #fileImport + script
```

### (g) 备份确认
`/home/haoluo/tsa_pwa/index_v2_backup.html` 存在（94,788 字节，覆盖前复制的 v2 原件）。
`sw.js`（CACHE 'tsa-cut-v2'，network-first）与 `manifest.webmanifest` **未改动**（MD5/时间戳校验）。

## 超出验收的额外验证

1. **运行时功能测试（node DOM stub）: 64 PASS / 0 FAIL**，覆盖:
   - 初始化（9 周芯片、4 日 tab、6 张动作卡、手册 9 章节、种子数据 5 条心肺 + 2 条睡眠、默认今天=周三、默认程序 tsa）
   - 饮食: 周一/三/四/五/六模板（周三无晚饭+爬楼机注、周五 5 槽含社交晚饭、周末 cheat 2600-3000kcal）、7 天条预览、规则卡 7 条
   - 心肺录入追加、sparkline×2、趋势 newest-first、睡眠基线(近 7 最低=54)
   - 配速阶梯全 4 分支: 费劲→冻结配速 / 峰值≥175→本次降速 / 末尾连续≥2 次均值≤150→可提 0.1 / 均值 155-158 且配速上调→hold 2-3 次 / 默认维持
   - 睡眠警报: 单次≥63 触发；基线条显示
   - 体重: 周分组、周均、周差、%/月换算、**连续 2 个"已完成周"各掉 >1.2kg 触发警报（含跨周连续性与周日<今天判定）**、进行中周不参与警报、空态文案
   - 计划切换: jt20/rippler 占位卡（标题+一句话+“数据包待生成：减脂结束测试新 1RM 后自动接入”）、回切 tsa 恢复、选择持久化 tsa_cut.program
   - copyWeek toast 含字面量“复制本周记录”
   - 导入: v1（缺失字段→保持本机现状，1RM/logs 恢复）、v2（cardio/sleep/weight/program 全恢复）、坏 JSON 拒绝
2. **真实浏览器（Chrome headless + CDP 360×780 与 390×844 @2x）**:
   - 4 个 tab + ⋯ 菜单 + 手册 + 占位卡：**零横向滚动**（scrollW==clientW==innerW）
   - body 15px；全部文本输入 font-size ≥16px；**全部交互目标 ≥44px**（含修正 v2 遗留 rmjump 40→44px）
   - 4 tab 像素级互异（diff 24-51%）；localStorage 键与规格完全一致
3. **导出/导入完整性**: blob 下载 + textarea 回退（insertFallbackTA）+ file input 导入三件套齐备；导出 payload = {app:"tsa-cut", version:2, exportedAt, onerm, logs, cardio, sleep, weight, program}
4. **单文件架构约束**: 最终 HTML 100% 由 build_html_v3.py 脚本生成（模板替换），非单次手写。

## 自检修正记录（复核阶段发现并修复）
- 体重警报原实现未限定“已完成周”：半周数据可能误报 → 增加 weekDone（周日 ≤ 今天）+ 相邻周连续（周一差 7 天）判定，并补 2 个测试
- 配速阶梯 hold 分支原无测试 → 补测试（155-158 + 前次配速更低 → hold 2-3 次）
- v2 遗留 .rmjump 40px 不满足 44px 规格 → 提升至 44px
- 周五“跑后”槽文案去除编辑性括注，与规格模板逐字对齐
