# 修复 E-12 数字人分析措辞 + 补充 Embrace 自报姓名

## TL;DR

> **Quick Summary**: 修复 `script/game_design.txt` 中 E-12（手机短信记录）两块内容：
> 1. 重写数字人自动分析，措辞从"这两条消息至少有一条不是麻姐本人发的"改为更合理的中性描述（不替玩家下结论）
> 2. 在【与网友Embrace的对话】开头部分，让 Embrace 自报真名"张英河"，让玩家能把 E-12 短信里的 "Embrace" 和 E-11 信用记录里的"张英河"关联起来
>
> **Deliverables**:
> - `script/game_design.txt` 中 2 处编辑
> - 不动其他文件
>
> **Estimated Effort**: Quick（2 个 Edit）
> **Parallel Execution**: YES — 2 处编辑在不同行范围
> **Critical Path**: Fix 1 → Fix 2 → 验证

---

## Context

### 原始请求
用户指出 E-12 数字人分析"这两条消息至少有一条不是麻姐本人发的"措辞不合理——这种"同一分钟内互相问'你在哪'"的对话模式在真实场景太常见（手机放口袋误触、对方也在线互相问），不应直接上升为"至少有一条不是本人发"。

同时指出 E-12 缺少网友自报真名的内容——E-11 网友信用记录显示真名"张英河"，玩家无法把短信里的"Embrace"和信用记录里的"张英河"关联起来。

### 当前状态
- Tasks 1-13 已完成（game16-evidence-sync 计划）
- F1-F3 验证已通过
- 本计划是 **game16-evidence-sync 之后的增量修复**，不重复已有工作

---

## Work Objectives

### Core Objective
让 E-12 数字人分析的措辞更合理（指出矛盾点但不替玩家下结论），同时让对话中体现 Embrace 自报真名"张英河"。

### Concrete Deliverables
- E-12 数字人分析段：改写为中性描述
- E-12 【与网友Embrace的对话】开头：增加 Embrace 自报真名"张英河"的内容

### Definition of Done
- [ ] E-12 数字人分析不再含"至少有一条不是麻姐本人发的"措辞
- [ ] E-12 对话部分含"张英河"或"我叫张英河"等自报姓名内容
- [ ] 11 条证据（E-01 ~ E-11 已有，E-12 待改）其他内容不动

### Must Have
- 数字人分析新措辞要保留"13:30 定位关闭之后"+"同分钟互相问'你在哪'"两个关键信息点
- 新措辞要引导玩家结合其他证据（WiFi 日志）做判断，而不是直接下结论
- Embrace 自报姓名要符合社恐、礼貌、线上温柔体贴的人物特征（不显得突兀）

### Must NOT Have
- ❌ 不改 E-12 其他内容（与教练/丈夫的对话、之前的聊天记录等）
- ❌ 不动 E-11（网友信用记录）—— 那条内容已经是对的
- ❌ 不动 13:33 那两条已改过的消息
- ❌ 不动数字人自动分析的其他任何证据

---

## Execution Strategy

### 并行 2 个 Edit（不同行范围，不冲突）

```
Wave 1（2 个独立 Edit）：
├── Fix 1: E-12 数字人分析措辞重写（行 558）
└── Fix 2: E-12 对话开头增加 Embrace 自报姓名（行 543-547 附近）

Wave FINAL：
└── F1: 验证
```

---

## TODOs

- [ ] 1. 修复 E-12 数字人分析措辞

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：558
  - 旧文本（精确）：
    ```
       数字人自动分析（提取关键信息后）：
       - 13:33 这两条消息的发送时间是麻姐手机失联之后（定位 13:30 关闭）。而且这两条是同一分钟内互相发的——一个人在问"你在哪"，另一个人立刻回复"我到健身房门口了"。这种异常模式很可疑——这两条消息至少有一条不是麻姐本人发的。
    ```
  - 新文本（更合理，不替玩家下结论）：
    ```
       数字人自动分析（提取关键信息后）：
       - 13:33 这两条消息的发送时间，是在麻姐手机定位被关闭（13:30）之后。而且这两条是同一分钟内互相发的——Embrace 问"你在哪"，麻姐立刻回复"我到健身房门口了，你在哪"。表面上看像是普通对话，但也可能只是手机放在口袋/桌上的快捷回复。要判断是否异常，需要结合其他证据（比如 13:15-13:35 期间 Embrace 设备是否一直在健身房 WiFi 范围内）。
    ```
  - 注意：保留关键信息点（13:30 定位关闭 + 同分钟互相问"你在哪"），删除"至少有一条不是麻姐本人发的"这种过于激烈的判断
  - 注意：新增提示让玩家结合其他证据（WiFi 日志）做判断——这是 C-02 触发条件的自然引导

  **Must NOT do**:
  - 不改行 557（"数字人自动分析（提取关键信息后）："行）
  - 不改行 559 之后的内容

  **Acceptance Criteria**:
  - [ ] `grep -n "至少有一条不是麻姐本人发的" script/game_design.txt` → 0 匹配
  - [ ] 行 558 含"结合其他证据（比如 13:15-13:35 期间 Embrace 设备是否一直在健身房 WiFi 范围内）"

- [ ] 2. 在 E-12 【与网友Embrace的对话】开头增加 Embrace 自报真名

  **What to do**:
  - 文件：`script/game_design.txt`
  - 行号：约 541-547（E-12 对话开头部分）
  - 当前内容（约 5 行对话）：
    ```
    【与网友Embrace的对话】
    Embrace：麻姐你好！我是小红书的Embrace，终于鼓起勇气联系你了！
    麻姐：你好呀！我看过你的吉他视频，弹得超棒！
    Embrace：谢谢麻姐！！我做了个手工电吉他拨片想送给你...可以见面给你吗？
    麻姐：哇真的吗？好呀，周五中午我在广埠屯附近，方便的话可以见一面。
    Embrace：好的！我到时候带给你！对了，这是我的无犯罪证明，怕你担心...
    （中略）
    ```
  - 在 Embrace 自报无犯罪证明（"这是我的无犯罪证明，怕你担心..."）之后，添加一句自报真名。**推荐写法**：
    ```
    Embrace：对了，我叫张英河……我有点社恐，平时线上聊天多，见面可能有点紧张。
    ```
  - 这是社恐、礼貌、线上温柔体贴的人物会说的——附带真名 + 性格说明，符合"Embrace 因社恐一直未主动联系"的设定（game_design.txt 第 183 行）

  **Edit 策略**：
  - oldString（精确匹配）：
    ```
    Embrace：好的！我到时候带给你！对了，这是我的无犯罪证明，怕你担心...
    ```
  - newString：
    ```
    Embrace：好的！我到时候带给你！对了，这是我的无犯罪证明，怕你担心...
    Embrace：对了，我叫张英河……我有点社恐，平时线上聊天多，见面可能有点紧张。
    ```
  - 保留前面所有内容不变，只在最后一行后追加新一行

  **Must NOT do**:
  - 不改【与网友Embrace的对话】标题行
  - 不改拥抱姐回复的 3 条消息
  - 不改 Embrace 前 3 条消息的格式

  **Acceptance Criteria**:
  - [ ] `grep -n "张英河" script/game_design.txt` 在 E-12 区域（行 540-560）有匹配
  - [ ] `grep -n "我叫张英河" script/game_design.txt` 有 1 匹配
  - [ ] E-12 标题行 539 保持原样

---

## Final Verification Wave

- [ ] F1. **最终验证** — `quick`

  执行 3 个 grep：
  1. `grep -n "至少有一条不是麻姐本人发的" script/game_design.txt` → 0 匹配
  2. `grep -n "我叫张英河" script/game_design.txt` → 1 匹配（行 547 附近）
  3. `grep -n "结合其他证据（比如 13:15-13:35 期间 Embrace 设备" script/game_design.txt` → 1 匹配（行 558 附近）

  输出：`Fix 1 ✅ | Fix 2 ✅ | VERDICT: APPROVE`

---

## Commit Strategy

单次 commit：
- `docs(design): refine E-12 analysis wording and add Embrace real name`
- 文件：`script/game_design.txt`
- commit body 列出 2 处编辑

---

## Success Criteria

### Verification Commands
```bash
# 1. 旧措辞已删除
grep -n "至少有一条不是麻姐本人发的" script/game_design.txt
# 期望：无输出

# 2. 新措辞已添加
grep -n "结合其他证据（比如 13:15-13:35 期间 Embrace 设备" script/game_design.txt
# 期望：1 行匹配

# 3. Embrace 自报真名
grep -n "我叫张英河" script/game_design.txt
# 期望：1 行匹配

# 4. 21 条证据其他不动
grep -cE "^E-[0-9]+｜" script/game_design.txt
# 期望：21 匹配
```

### Final Checklist
- [ ] 2 处编辑全部到位
- [ ] E-12 数字人分析措辞合理（不替玩家下结论）
- [ ] E-12 对话中含张英河自报姓名
- [ ] E-11（网友信用记录）不动
- [ ] 21 条证据全部完整
