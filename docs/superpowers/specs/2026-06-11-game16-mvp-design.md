# 解谜游戏16：消失的麻姐 — MVP 设计规格

**版本**：1.0.0
**日期**：2026-06-11
**状态**：已批准
**作者**：Atlas（brainstorming session）

---

## 1. 目标与范围

### 1.1 目标

实现《解谜游戏16：消失的麻姐》的 **MVP 可玩原型**——玩家能在浏览器中走完 5 阶段主流程、获取全部 21 个证据、看到 4 个 Combine 结论、触发 4 种结局。

### 1.2 范围

**包含**：
- 5 阶段完整剧情（引入 → 初步调查 → 深入调查 → 证据组合 → 郑桥介入+结局）
- 全部 21 个证据（E-01 ~ E-21）可获取
- 全部 4 个 Combine 结论（C-01 ~ C-04）可触发
- 全部 4 种结局（贪婪的代价 / 正义的救赎 / 堕落的代价 / 沉默的守护）可触发
- 命令系统（help / list / access / combine / conclusions / backup / submit / clear）
- localStorage 状态保存（手动 + 自动）
- 视觉/动画效果（启动画面、光标闪烁、证据解锁动画、阶段过渡、郑桥介入闪烁）

**不包含**：
- PWA / Service Worker / 离线缓存
- 真实后端 API（所有数据内嵌）
- 移动端深度优化（PC 浏览器为主，移动端能用即可）
- 存档导入/导出
- 多语言

### 1.3 发布形式

**GitHub Pages 静态托管**。玩家通过 `https://username.github.io/game16/` 访问。

---

## 2. 架构

### 2.1 总体架构

采用**单状态机 + 命令分发**模式（方案 A）：

```
┌─────────────────────────────────────────────┐
│  index.html（terminal UI 框架）              │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│  js/main.js（应用入口）                      │
│  - DOMContentLoaded → Game.init()           │
│  - 绑定 input 事件 → CommandDispatcher      │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│  js/command.js（命令分发器）                 │
│  - parseInput(raw) → {cmd, args}            │
│  - dispatch(parsed) → game.js + effects     │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│  js/game.js（游戏引擎 / GameState）          │
│  - GameState: 全局状态对象                  │
│  - 系统访问：accessOA(), accessGym()...     │
│  - combine(): 触发 C-01 ~ C-04              │
│  - 结局判定：checkEnding()                  │
│  - 持久化：save() / load()                  │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│  js/evidence.js（证据数据）                  │
│  - const EVIDENCE = { E01: {...}, ... }     │
│  - 21 个证据的完整数据                       │
└────────────┬────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│  js/ui.js（UI 效果）                         │
│  - print(text, type)：打字机效果             │
│  - animate(type)：证据解锁/阶段过渡动画     │
│  - startScreen()：启动画面                  │
│  - cursorBlink()：光标闪烁                  │
└─────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 职责 | 依赖 |
|---|---|---|
| `index.html` | DOM 骨架、终端 UI 布局、字体引入 | - |
| `css/style.css` | 黑底紫字/白字、动画 keyframes、响应式 | - |
| `js/main.js` | 应用入口、事件绑定、初始化 | command, game, ui |
| `js/command.js` | 输入解析、命令路由、解锁检查 | game, evidence, ui |
| `js/game.js` | GameState、业务逻辑、阶段转换、Combine、Ending、持久化 | evidence, ui |
| `js/evidence.js` | 21 个证据的静态数据 | - |
| `js/ui.js` | 输出渲染、动画、特效 | - |

**依赖方向**：`main → command → game → evidence`
`ui` 被所有层调用（无状态工具集）。

---

## 3. 数据模型

### 3.1 GameState

```js
const INITIAL_STATE = {
  // 阶段控制
  currentStage: 1,                    // 1-5
  stageIntroShown: { 1: true, 2: false, 3: false, 4: false, 5: false },
  
  // 证据系统
  unlockedEvidence: [],               // ['E-01', 'E-02', ...]
  evidenceViewed: {},                 // { 'E-02': true } (玩家已 list 查看)
  combineUnlocked: [],                // ['C-01', 'C-02', ...]
  
  // 系统解锁
  unlockedSystems: [],                // ['OA', '门禁', '停车场', '公共监控系统', '短信', '微信', '相册', '健身房', '信用查询']
  
  // 剧情进度
  gymNameEntered: false,              // 玩家是否输入了"炼健身"
  phoneUnlocked: false,               // 玩家是否输入了 1222
  backupPrompted: false,              // 数字人是否提示过 backup
  backupCreated: false,               // 玩家是否实际 backup
  
  // 结局系统
  endingReached: null,                // 'ending1' | 'ending2' | 'ending3' | 'ending4'
  
  // 元数据
  startTime: 0,                       // Date.now()
  saveTime: 0,
  totalCommands: 0,
  version: '1.0.0',
};
```

### 3.2 证据数据

```js
// js/evidence.js
const EVIDENCE = {
  'E-01': {
    id: 'E-01',
    name: '手机定位历史',
    type: 'data',
    source: '数字人自带权限',
    unlockCondition: () => true,        // 第一阶段自动触发
    autoUnlock: true,
    content: {
      title: '2026年6月17日麻姐手机定位记录',
      data: [
        { time: '11:35', location: '离开楚门科技（中南路）' },
        { time: '11:50', location: '到达广埠屯区域' },
        { time: '11:50-13:30', location: '停留在广埠屯区域' },
        { time: '13:30', location: '定位被手动关闭' },
      ],
      analysis: '麻姐 13:30 后失联，定位关闭很反常。',
    },
  },
  'E-02': {
    id: 'E-02',
    name: 'OA聊天记录（与郑桥）',
    type: 'text',
    source: 'OA系统·工作聊天模块',
    unlockCondition: (state) => state.unlockedSystems.includes('OA'),
    autoUnlock: false,
    content: { /* 12 条消息 */ },
  },
  // ... E-03 ~ E-21
};
```

### 3.3 Combine 配置

```js
// js/game.js
const COMBINES = {
  'C-01': {
    id: 'C-01',
    name: '麻姐的消失地点矛盾',
    requires: ['E-05', 'E-18'],
    analysis: '公司门禁：麻姐 13:53 刷卡进入 / 健身房门禁：11:50 入馆，无出场记录 → 有人复制了她的工牌',
  },
  'C-02': {
    id: 'C-02',
    name: '网友embrace的地点矛盾',
    requires: ['E-12', 'E-20'],
    analysis: 'Embrace 说去吃饭，但 WiFi 一直在连接健身房 → Embrace 没离开过健身房',
  },
  'C-03': {
    id: 'C-03',
    name: '郑桥的地点矛盾',
    requires: ['E-08', 'E-20'],
    analysis: '13:15-13:45 在洗车店卫生间，但 13:21 手机连健身房 WiFi → 郑桥借口上卫生间去健身房',
  },
  'C-04': {
    id: 'C-04',
    name: '教练的动机',
    requires: ['E-09', 'E-13'],
    analysis: '教练欠下 47 万赌债 + 向麻姐借 2 万 → 有明确经济动机',
  },
};
```

### 3.4 结局配置

```js
const ENDINGS = {
  'ending1': {
    id: 'ending1',
    name: '贪婪的代价',
    condition: (state) => state.playerChoice === 'accept',
    fullText: '...',  // 来自 game_design.txt 第七部分
  },
  'ending2': {
    id: 'ending2',
    name: '正义的救赎',
    condition: (state) => state.playerChoice === 'decline' && state.backupCreated,
  },
  'ending3': {
    id: 'ending3',
    name: '堕落的代价',
    condition: (state) => state.playerChoice === 'extortion',
  },
  'ending4': {
    id: 'ending4',
    name: '沉默的守护',
    condition: (state) => state.playerChoice === 'decline' && !state.backupCreated,
  },
};
```

---

## 4. 命令系统

### 4.1 命令列表

| 命令 | 描述 | 何时解锁 | 实现函数 |
|---|---|---|---|
| `help` | 显示当前可用命令 | 始终 | `showHelp()` |
| `list` | 查看证据清单 | 始终 | `listEvidence()` |
| `access` | 查看可访问的系统列表 | 始终 | `accessSystem()` |
| `clear` | 清除所有证据和结论（需 confirm 二次确认） | 始终 | `clearProgress()` |
| `combine <id>+<id>` | 组合分析证据 | 解锁 >=2 证据 | `combineEvidences(args)` |
| `conclusions` | 查看数字人分析结论 | 解锁 >=1 Combine | `showConclusions()` |
| `backup` | 备份证据到本地 | 数字人提示后 | `backupProgress()` |
| `submit` | 提交证据给警方 | 结局 2 触发后 | `submitEvidence()` |

### 4.2 命令分发

```js
// js/command.js
function parseInput(raw) {
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  return { cmd: parts[0], args: parts.slice(1), raw: trimmed };
}

function dispatch(input) {
  const parsed = parseInput(input);
  const command = COMMANDS[parsed.cmd];
  
  if (!command) {
    ui.print(`未知命令：${parsed.cmd}`, 'error');
    ui.print('输入 help 查看可用命令。', 'hint');
    return;
  }
  
  if (command.unlockedWhen && !command.unlockedWhen(game.state)) {
    ui.print('该命令暂未解锁。', 'error');
    return;
  }
  
  game.state.totalCommands++;
  command.fn(parsed.args);
}
```

### 4.3 access 子命令

`access` 后跟系统名进入子系统。例如：
- `access → OA` → 进入 OA 系统，看到 4 个模块（通讯录/聊天/邮箱/流程）
- `access → 停车场` → 看到车辆出入记录
- `access → 健身房` → 看到门禁记录（解锁手机后才能访问）

**子命令实现**：
```js
// access 进入后，状态变为 'in_system: <system>'
// 玩家的下一条命令在子系统的上下文中执行
// 玩家输入 'back' 或 'exit' 返回主菜单
```

---

## 5. 阶段逻辑

### 5.1 阶段 1：引入

**触发**：游戏启动
**自动事件**：
- 启动画面（`GAME 16` + `消失的麻姐` 渐显）
- 数字人自我介绍
- 显示定位记录 → 自动解锁 E-01
- 数字人引导玩家输入 `help` 和 `access`

**转阶段条件**：玩家确认帮助（输入 `help` 或 `access`）

### 5.2 阶段 2：初步调查

**解锁**：OA 系统、门禁系统（需点击激活链接）、停车场系统

**关键流程**：
1. `access → OA` → 显示 4 个模块（通讯录/聊天记录/邮箱/流程）→ 选择"通讯录"查看员工
2. `access → OA` → 选择"聊天记录" → "郑桥" → 解锁 E-02
3. `access → OA` → 选择"邮箱" → 查看 M-2026-2098（门禁激活邮件）
4. **关键交互**：玩家输入 `confirm` 激活门禁权限 → 解锁 E-04/E-05/E-06
5. `access → 停车场` → 查看车辆出入 → 输入"鄂A·8K329" → 服务联动 → 广捷洗车
6. `access → 公共监控系统` → 输入"广捷洗车" → 解锁 E-08
7. 数字人引导："麻姐常去哪家健身房？" → 玩家答"炼健身" → 提示手机密码

**注**：所有系统访问通过 `access` 命令进入，主菜单用 `access` 列出已解锁系统，子系统用 `back` 退出。系统命名统一为：`OA` / `门禁` / `停车场` / `公共监控系统` / `短信` / `微信` / `相册` / `健身房` / `信用查询`。

**转阶段条件**：玩家输入"炼健身" + 解锁手机密码 1222

### 5.3 阶段 3：深入调查

**触发**：玩家输入 1222
**解锁**：短信、微信、相册、健身房门禁小程序、WiFi 日志

**关键流程**：
1. `access → 短信` → 查看与 Embrace 短信 → E-12
2. `access → 微信` → 聊天记录（教练/丈夫/支付）
3. `access → 相册` → 借条照片（E-13）+ WiFi 视频（E-14）
4. `access → 微信小程序` → "炼健身" → 教练详情（E-17）
5. **关键交互**：玩家输入"138xxxx7753" → 查教练信用（E-09）
6. 玩家输入"ljs_5G" + "justdoit" → 接入 DNS 日志 → E-20
7. **数字人提示**：备份时机到了 → 解锁 `backup` 命令

**转阶段条件**：数字人提示 backup 后

### 5.4 阶段 4：证据组合

**触发**：数字人完成所有 C-XX 分析引导后
**解锁**：`combine` 命令

**关键流程**：
1. 玩家输入 `combine E-05+E-18` → C-01
2. 玩家输入 `combine E-12+E-20` → C-02
3. 玩家输入 `combine E-08+E-20` → C-03
4. 玩家输入 `combine E-09+E-13` → C-04
5. 数字人告警："检测到郑桥正在访问系统"

**转阶段条件**：4 个 Combine 全部完成 + 异常检测

### 5.5 阶段 5：郑桥介入 + 结局

**触发**：阶段 4 完成后

**关键流程**：
1. 屏幕闪烁 + `[警告] 检测到未经授权的外部访问`
2. 郑桥黑入系统，强制对话：显示 `accept` / `decline` 两个选项
3. 玩家输入 `accept` → 触发结局 1；输入 `decline` → 进入二级判定
4. 玩家输入 `decline` 后，**数字人检测玩家是否尝试与凶手交易**：
   - 若玩家下一条输入含"钱"/"要价"/"勒索"/"交易"等关键词 → 触发结局 3
   - 否则按 `state.backupCreated` 判定结局 2 或结局 4
5. 4 种结局分支：
   - `accept` → 结局 1（贪婪的代价）
   - `decline` + 已 backup → 结局 2（正义的救赎）
   - `decline` + 敲诈（extortion）→ 结局 3（堕落的代价）
   - `decline` + 未 backup → 结局 4（沉默的守护）

**`playerChoice` 何时设置**：
- `accept`/`decline` 在郑桥强制对话时直接设置
- `extortion` 在 `decline` 后的下一条输入检测到敲诈关键词时设置

**结局后**：显示结算（结局名 + 关键证据数 + 提示分享）

---

## 6. UI / 动画规格

### 6.1 视觉

| 元素 | 样式 |
|---|---|
| 背景 | 纯黑 `#000000` |
| 主文字 | 浅绿 `#00ff00` |
| 标题/重点 | 亮黄 `#ffff00` |
| 错误/警告 | 红色 `#ff5555` |
| 链接/可点击 | 紫色 `#bb86fc` |
| 字体 | monospace（`Courier New`, `Consolas`, `Monaco`） |
| 字号 | 16px（PC），14px（移动） |
| 行高 | 1.4 |

### 6.2 动画

| 场景 | 动画 |
|---|---|
| 启动画面 | `GAME 16` 渐显（CSS animation，2s）+ 下方"消失的麻姐"延迟 1s 出现 |
| 命令输入区光标 | 绿色 ▌ 1s 周期闪烁（CSS animation infinite） |
| 打字机效果 | 每字 30ms 延迟输出（JS setTimeout） |
| 证据解锁 | 黄色高亮 + 屏幕背景短暂闪动（CSS class 切换 200ms） |
| 阶段过渡 | 黑屏 1s + `[SYSTEM] 进入阶段 X：标题...` |
| 郑桥介入 | 屏幕闪烁 3 次（红/黑交替，每次 200ms） |
| 结局展示 | 全屏黑底 + 结局名大字 + 完整结局文本逐字显示 |

### 6.3 终端 UI 布局

```
┌──────────────────────────────────────────────┐
│  GAME 16 — 消失的麻姐                          │  ← 标题区
├──────────────────────────────────────────────┤
│                                              │
│  [数字人] 你好，网友。我是麻姐的数字人...      │  ← 滚动输出区
│                                              │
│  2026-06-17 11:35 —— 离开楚门科技            │
│  2026-06-17 11:50 —— 到达广埠屯区域            │
│  ...                                          │
│                                              │
│  [新证据已解锁：E-01]                         │  ← 黄色高亮
│                                              │
│  > help                                      │
│  当前可用操作：                                │
│    help       显示本菜单                      │
│    list       查看证据清单                    │
│    ...                                        │
│                                              │
│  ─────────────────────────────────────────   │
│  > ▌                                          │  ← 命令输入区（带闪烁光标）
└──────────────────────────────────────────────┘
```

---

## 7. 持久化

### 7.1 Save / Load

```js
const SAVE_KEY = 'game16-save-v1';

function save() {
  const data = {
    state: game.state,
    saveTime: Date.now(),
    version: '1.0.0',
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    ui.print('[系统] 进度已保存。', 'hint');
  } catch (e) {
    ui.print('[错误] 保存失败：' + e.message, 'error');
  }
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.version !== '1.0.0') {
      console.warn('存档版本不匹配');
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}
```

### 7.2 自动保存时机

- 每完成 1 个证据解锁后
- 每完成 1 个 Combine 后
- 进入阶段 5 前
- 做出结局选择后

### 7.3 手动命令

- `Ctrl+S` → 触发 save()
- `clear` 命令 → 删除 localStorage 中的存档（需 `confirm` 二次确认）

---

## 8. 文件结构

```
~/Desktop/game16/
├── index.html              (terminal UI 框架，约 50 行)
├── css/
│   └── style.css          (黑底紫字、动画，约 200 行)
├── js/
│   ├── main.js            (应用入口，约 50 行)
│   ├── command.js         (命令分发，约 100 行)
│   ├── game.js            (GameState + 引擎，约 400 行)
│   ├── evidence.js        (21 证据数据，约 800 行)
│   └── ui.js              (UI 效果，约 200 行)
├── assets/                 (空，预留)
├── script/                 (现有文档)
├── docs/                   (现有 + 本设计文档)
├── .omo/                   (现有计划)
├── .gitignore
└── README.md               (新增 — 玩家使用说明)
```

**预计总代码量**：~1800 行（不含 evidence.js 数据填充，evidence.js 约 800 行）

---

## 9. 测试策略

### 9.1 单元测试

MVP 范围内**不引入测试框架**（YAGNI）。但用以下手动验证清单：

| 验证项 | 通过条件 |
|---|---|
| 启动 | 看到启动画面，5s 内自动进入对话 |
| 命令分发 | `help` / `list` / `access` 都能正确响应 |
| 阶段 1 | 定位记录显示完整 |
| OA 激活 | 点击激活链接后门禁系统解锁 |
| 密码 | 输入 1222 解锁手机，输入其他数字提示错误 |
| Combine | 4 个 Combine 都能触发，输入错误证据 ID 提示"证据不存在" |
| 结局 | 4 个结局都能触发并完整显示 |
| 存档 | F5 刷新后继续游戏；`clear` 后从头开始 |
| 移动端 | iPhone Safari 可用，输入区不被键盘遮挡 |

### 9.2 验收测试

走完一整遍主流程 + 触发任一结局，验证无 JS 错误。

---

## 10. 实施顺序（高层）

1. **骨架**：`index.html` + `css/style.css` + `js/main.js` — 终端 UI 框架
2. **数据**：`js/evidence.js` — 21 个证据的完整数据（从 design 文档提取）
3. **引擎**：`js/game.js` — GameState、阶段逻辑、Combine、Ending
4. **命令**：`js/command.js` — 8 个命令的实现
5. **UI**：`js/ui.js` — 打字机、动画、阶段过渡
6. **持久化**：save/load + 自动保存
7. **README**：玩家使用说明 + 本地启动方式
8. **测试**：走完主流程

---

## 附录 A：21 个证据清单

来自 `script/game_design.txt` 第四部分：
- E-01：手机定位历史
- E-02：OA 聊天记录（与郑桥）
- E-03：OA 邮箱记录
- E-04：公司门禁记录——郑桥
- E-05：公司门禁记录——麻姐
- E-06：公司停车场记录
- E-07：超市监控
- E-08：洗车店监控
- E-09：教练信用信息
- E-10：郑桥信用记录
- E-11：网友信用记录
- E-12：手机短信记录（全量）
- E-13：手机相册 - 教练欠钱
- E-14：手机相册 - WiFi 账号密码
- E-15：微信聊天记录（老公）
- E-16：微信聊天记录（大怪兽教练）
- E-17：健身房教练信息
- E-18：健身房门禁记录
- E-19：健身房监控截图
- E-20：健身房 Wi-Fi 日志
- E-21：微信支付记录

## 附录 B：4 个 Combine 触发条件

| Combine | 需要的证据 | 触发逻辑 |
|---|---|---|
| C-01 | E-05 + E-18 | 麻姐公司 13:53 打卡 vs 健身房无出场 |
| C-02 | E-12 + E-20 | Embrace 说去吃饭 vs WiFi 一直连健身房 |
| C-03 | E-08 + E-20 | 郑桥 13:15-13:45 在洗车店 vs 13:21 手机连健身房 WiFi |
| C-04 | E-09 + E-13 | 教练 47 万赌债 + 欠麻姐 2 万 → 经济动机 |

## 附录 C：4 个结局触发条件

| 结局 | 触发 |
|---|---|
| 贪婪的代价 | 玩家选择 `accept` |
| 正义的救赎 | 玩家选择 `decline` + 已 backup |
| 堕落的代价 | 玩家尝试敲诈凶手 |
| 沉默的守护 | 玩家选择 `decline` + 未 backup |
