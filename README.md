# 解谜游戏16：消失的麻姐

一款基于终端风格的 Meta 解谜游戏。玩家扮演麻姐的同事，通过命令行界面调查麻姐的失踪事件。

历经2个月，经历了4次重做。麻姐尽力了😭

## 玩法

在浏览器中打开 `http://localhost:8000`（或任意静态服务器地址），即可开始游戏。

### 基础命令（自己去游戏看）

- `help` — 显示所有可用命令列表
- `list` — 查看当前已解锁的证据清单
- `access` — 访问已解锁的系统（OA/手机/健身房等）
- `combine E-XX+E-YY` — 组合两条证据进行分析
- `save` — 保存当前游戏进度到浏览器 localStorage
- `load` — 从 localStorage 加载之前保存的进度
- `clear confirm` — 彻底清除所有存档数据

### 游戏流程（自己去游戏看）

1. **阶段 1（自动）**：数字人麻姐介绍情况
2. **阶段 2（手动）**：调查 OA 系统，获取门禁卡
3. **阶段 3（手动）**：解锁手机，调查微信/短信记录
4. **阶段 4（手动）**：调查健身房证据
5. **阶段 5（Combine）**：组合证据，推理真凶

### 系统访问

使用 `access` 命令进入不同系统：

- `OA` — 公司办公系统（通讯录/聊天/邮件）
- `门禁` — 门禁记录（需先获取门禁卡）
- `停车场` — 停车场记录
- `公共监控系统` — 监控录像
- `短信` — 麻姐的短信记录（需输入手机密码）
- `微信` — 麻姐的微信记录
- `健身房` — 炼健身系统（需获取门禁卡）
- `信用查询` — 个人信用报告

## 技术栈

- 纯 HTML5 + CSS3 + 原生 JavaScript
- 无框架、无外部依赖
- localStorage 持久化
- 终端风格 UI
- 多文件组织（GitHub Pages 友好）

## 本地启动

### Python 方式（推荐）

```bash
cd ~/Desktop/game16
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### Node.js 方式

```bash
cd ~/Desktop/game16
npx http-server -p 8000
# 浏览器打开 http://localhost:8000
```

### 其他方式

任意能托管静态文件的服务器（Nginx、Apache、GitHub Pages）均可。

## 项目结构

```
game16/
├── index.html              # 终端 UI 框架
├── css/
│   └── style.css           # 样式（黑底绿字、动画）
├── js/
│   ├── main.js             # 应用入口
│   ├── ui.js               # UI 输出工具
│   ├── game.js             # GameState + 阶段逻辑
│   ├── evidence.js         # 21 个证据数据
│   └── command.js          # 命令分发器
├── script/                 # 原始剧本设计文档
│   ├── game_design.txt     # 游戏设计 v7.0
│   └── 第六部分：游戏流程.md  # 完整对白流程
├── docs/
│   └── superpowers/
│       ├── specs/          # 规格说明文档
│       └── plans/          # 实现计划文档
└── README.md               # 本文件
```

## 游戏数据

- 22 个证据（E-01 ~ E-22）
- 4 个 Combine 推理（C-01 ~ C-04）
- 3 个结局（基于推理正确性）
- 2 个隐藏结局（需要触发条件）
- 1 个四周目结局
- 多个系统数据源（OA、门禁、监控、信用报告等）

## 开发说明

本项目由 AI 代理（Atlas Orchestrator）基于 subagent-driven-development 工作流实现：

- 实现计划：`docs/superpowers/plans/2026-06-11-game16-mvp.md`
- 设计规范：`docs/superpowers/specs/2026-06-11-game16-mvp-design.md`
- Git 提交历史按任务组织（`git log --oneline` 查看）

## 版权与许可证

本作品使用 MIT 许可证。详见 `LICENSE` 文件（如有）。

---

**游戏作者**: 芝麻  
**版本**: v3.0.0  
**发布日期**: 2026-07-01
