# 修复《解谜游戏16：消失的麻姐》Critical 逻辑/叙事问题

## TL;DR

> **Quick Summary**: 修复两份设计文档中 6 个会让玩家卡死/解不出谜题/走不下去的 Critical 级别问题，全部是文档层修复（无代码改动）。
>
> **Deliverables**:
> - `script/game_design.txt` 中 4 处编辑
> - `script/第六部分：游戏流程.md` 中 0 处编辑（问题全部集中在 game_design.txt）
>
> **Estimated Effort**: Quick（每个修复 1-2 个 Edit 调用）
> **Parallel Execution**: YES — 6 个修复可批量串行执行
> **Critical Path**: F1 → F2 → F3 → F4 → F5 → F6

---

## Context

### 原始请求
博主对两份游戏设计文档做逻辑/叙事审查（仅 Critical 级），发现 6 个严重问题，希望逐条修复。

### 审查背景
- `script/game_design.txt` v7.0（1056 行）— 总设计文档
- `script/第六部分：游戏流程.md` v2.0（2375 行）— 逐字对白
- 审查范围：仅 Critical（"会让玩家卡死/解不出谜题/退出游戏"）
- 已手工发现 6 个 Critical 问题（后台 agent 未补充新内容）

### 关键发现汇总
- **2 个 Combine 证据 ID 错乱**（CRIT-01/02）— 玩家按文档提示触发不了结论
- **2 个时间线/叙述自相矛盾**（CRIT-03/04）— 关键证据链崩
- **1 个命令拼写不一致**（CRIT-05）— 玩家按 help 提示找不到命令
- **1 个 UX 雷：clear 无确认**（CRIT-06）— 误操作清空所有证据

---

## Work Objectives

### Core Objective
逐条修复 game_design.txt 中的 6 个 Critical 问题，让设计文档在逻辑/叙事层自洽，流程文档不受影响。

### Concrete Deliverables
- 修复后 `script/game_design.txt` 通过以下断言：
  - 任何 `combine E-XX+E-YY` 引用的 E 编号在证据清单中存在且语义正确
  - E-04/E-05 关键信息与数字人分析、实际门禁数据一致
  - 第 992-993 行叙述的"郑桥回公司刷卡"过程与门禁数据自洽
  - `conclusions` 命令拼写统一
  - `clear` 命令加二次确认或移除

### Definition of Done
- [ ] grep `combine E-` 0 处 ID 错乱
- [ ] 第 442/444/992/993 行时间/叙述一致
- [ ] 第 861 行命令名是 `conclusions`
- [ ] 第 857 行 `clear` 命令加了确认机制

### Must Have
- 保持文档其他内容 100% 不变（精确替换，不重写周边段落）
- 修复后的文本能通过自然阅读理解（不只是字符串匹配）

### Must NOT Have
- ❌ 不改流程文档（第六部分.md）— 所有问题都在 game_design.txt
- ❌ 不顺手"优化"无关段落（避免 AI slop 风险）
- ❌ 不改变证据本身的语义（不重新定义 E-12/E-16/E-08 是什么）

---

## Execution Strategy

### 串行执行（每条修复都是独立 Edit，可批量但建议按顺序确认）

```
Wave 1（独立 6 个 Edit 调用，无依赖）：
├── Fix 1: CRIT-01 — game_design.txt:684  E-16 → E-12
├── Fix 2: CRIT-02 — game_design.txt:687  E-12 → E-08
├── Fix 3: CRIT-03 — game_design.txt:442  12:35 → 12:48
├── Fix 4: CRIT-04 — game_design.txt:992-993  重写郑桥回公司刷卡叙述
├── Fix 5: CRIT-05 — game_design.txt:861  conclusion → conclusions
└── Fix 6: CRIT-06 — game_design.txt:857  clear 加二次确认

Critical Path: 任何顺序都可（无依赖），按编号顺序便于核对
```

---

## TODOs

- [ ] 1. 修复 CRIT-01（C-02 证据 ID E-16 → E-12）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：684
  - 旧文本：`C-02｜网友embrace的地点矛盾` 块中"获取方式：玩家组合证据 E-16（短信记录）和E-20（Wi-Fi日志）后"
  - 新文本：把 E-16 改为 E-12
  - 精确 oldString 包含上下文（`C-02｜网友embrace的地点矛盾` + 换行 + `   获取方式：` 行）以避免误匹配
  - 验证：用 grep "E-16" 确认 game_design.txt 中 Combine 引用已无错

  **Must NOT do**:
  - 不要改"数字人分析"那行
  - 不要把整段重写

  **Acceptance Criteria**:
  - [ ] `grep -n "E-16" script/game_design.txt` 在 680-700 行范围内无匹配
  - [ ] `grep -n "E-12（短信记录）" script/game_design.txt` 在 684 行有匹配

- [ ] 2. 修复 CRIT-02（C-03 证据 ID E-12 → E-08）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：687
  - 旧文本：`C-03｜郑桥的地点矛盾` 块中"获取方式：玩家组合证据 E-12（洗车店监控）和E-20（Wi-Fi日志）后"
  - 新文本：把 E-12 改为 E-08
  - 精确 oldString 包含 `C-03｜郑桥的地点矛盾` + 换行 + `   获取方式：` 行

  **Must NOT do**:
  - 不要改"数字人分析"那行
  - 不要把整段重写

  **Acceptance Criteria**:
  - [ ] `grep -n "E-12（洗车店监控）" script/game_design.txt` 在 680-700 行范围内无匹配
  - [ ] `grep -n "E-08（洗车店监控）" script/game_design.txt` 在 687 行有匹配

- [ ] 3. 修复 CRIT-03（E-04 关键信息 12:35 → 12:48）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：442
  - 旧文本：`12:35 —— 刷卡离开公司`（在 E-04｜公司门禁记录——郑桥 块的"关键信息"小节）
  - 新文本：`12:48 —— 刷卡离开公司`
  - 同时核对：第 444 行的数字人分析已经写"12:48 离开公司"——保持不动（已经是正确的）

  **Must NOT do**:
  - 不要改第 443 行（13:55 进入公司，与数据一致）
  - 不要改第 444 行的数字人分析（已经是 12:48）

  **Acceptance Criteria**:
  - [ ] `grep -n "12:35 —— 刷卡离开" script/game_design.txt` 无匹配
  - [ ] `grep -n "12:48 —— 刷卡离开" script/game_design.txt` 在 442 行有匹配

- [ ] 4. 修复 CRIT-04（郑桥回公司时间叙述重写）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：992-993
  - 旧文本：
    ```
    13:53-13:54 桥驾驶自己车辆回公司，正常刷卡上班,同时郑桥用复制麻姐工牌刷卡进入公司
    14:10 郑桥用复制麻姐工牌刷卡进入公司
    ```
  - 新文本（重写为与门禁数据 13:53/13:55 自洽的叙述）：
    ```
    13:53 郑桥用复制麻姐工牌刷卡进入公司（造成 13:53 麻姐打卡假象，对应工号 CM-2021-0047）
    13:55 郑桥本人用自己工牌正常刷卡进入公司（对应工号 CM-2020-0088）
    ```
  - 删除 14:10 那行（与实际数据不符；实际是 14:10 车进停车场，14:32 离开，文档 10.2 时间线那段独立列出 14:10 是车进入停车场，**与"用复制工牌刷卡"无关**）

  **Must NOT do**:
  - 不要改 10.2 时间线那段（第 992-993 之前的内容）
  - 不要改 14:10 这个时间点本身（停车场数据里确实有）—— 14:10 仍存在但表达成"14:10 郑桥驾车回公司停车场"或干脆删掉第 993 行；推荐**直接删除第 993 行**

  **Acceptance Criteria**:
  - [ ] `grep -n "13:53-13:54 桥驾驶自己车辆" script/game_design.txt` 无匹配
  - [ ] `grep -n "同时郑桥用复制麻姐工牌" script/game_design.txt` 无匹配
  - [ ] `grep -n "14:10 郑桥用复制麻姐工牌" script/game_design.txt` 无匹配（已删除）

- [ ] 5. 修复 CRIT-05（命令名 conclusion → conclusions）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：861
  - 旧文本：`conclusion - 查看数字人分析结论（得到一条结论后可用）`
  - 新文本：`conclusions - 查看数字人分析结论（得到一条结论后可用）`
  - 包含完整行（`【调查过程中逐步解锁】` 块内的命令），避免误匹配其他位置

  **Must NOT do**:
  - 不要把同段其他命令（combine/backup/submit）一起改

  **Acceptance Criteria**:
  - [ ] `grep -n "conclusion -" script/game_design.txt` 无匹配
  - [ ] `grep -n "conclusions -" script/game_design.txt` 在 861 行有匹配

- [ ] 6. 修复 CRIT-06（clear 命令加二次确认）

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：857
  - 旧文本：`clear   - 清除所有证据和结论`
  - 新文本（加确认机制说明）：
    `clear   - 清除所有证据和结论（需输入 confirm 二次确认，谨慎使用）`
  - 同步：在第 8.1 节命令总表上方或下方加一行说明，提示"clear 是危险操作"
  - 推荐方案：仅修改第 857 行的描述，**不**新增段落

  **Must NOT do**:
  - 不要把 clear 从"初始可用"移到"调查过程中逐步解锁"——这是有意的（给玩家试错机会）
  - 不要新增独立的"clear 二次确认"段落

  **Acceptance Criteria**:
  - [ ] `grep -n "clear.*清除所有证据" script/game_design.txt` 在 857 行匹配，新文本含"二次确认"

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  读修复后的 `script/game_design.txt`，逐条验证 6 个修复都到位：
  - 行 684：E-12（短信记录）
  - 行 687：E-08（洗车店监控）
  - 行 442：12:48 离开公司
  - 行 992-993：13:53 复制工牌 / 13:55 本人工牌，14:10 复制工牌已删
  - 行 857：clear 含"二次确认"
  - 行 861：conclusions（复数）
  - 用 grep 全文确认无残留错乱
  - 输出：`Fixes [N/6 verified] | VERDICT: APPROVE/REJECT`

- [ ] F2. **未触动范围核查** — `unspecified-high`
  用 `git diff script/game_design.txt`（若已是 git 仓库）或 md5 哈希对比：
  - 仅 6 处目标行被修改
  - 其他内容字节级未变（无 AI slop 顺手优化）
  - 流程文档 `script/第六部分：游戏流程.md` 完全未动
  - 输出：`Touched [6/6 expected] | Unintended [0] | VERDICT`

---

## Commit Strategy

- 单次 commit 包含全部 6 处修复：
  - `docs(design): fix 6 critical logic/narrative issues in game_design.txt`
  - 文件：`script/game_design.txt`
  - commit body 列出 6 个 CRIT ID

---

## Success Criteria

### Verification Commands
```bash
# 验证 1：Combine ID 错乱已修
grep -n "combine E-" script/game_design.txt     # 期望：每条 combine 行的 E 编号与证据清单匹配

# 验证 2：时间一致
grep -n "12:35" script/game_design.txt          # 期望：仅在阶段一文案中（"11:35 离开"位置），无"12:35 离开公司"

# 验证 3：郑桥回公司叙述
sed -n '990,995p' script/game_design.txt        # 期望：13:53 复制工牌 / 13:55 本人 / 无 14:10 复制工牌

# 验证 4：命令拼写
grep -n "conclusion" script/game_design.txt      # 期望：全部是 conclusions

# 验证 5：clear 二次确认
grep -n "clear" script/game_design.txt           # 期望：含"二次确认"或"confirm"
```

### Final Checklist
- [ ] 6 处修复全部到位
- [ ] `script/第六部分：游戏流程.md` 完全未动
- [ ] git diff 仅显示 6 处目标修改
- [ ] 自然阅读修复后段落语义通顺
