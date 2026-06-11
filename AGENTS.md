# 解谜游戏16：消失的麻姐

> 本项目使用 **superpowers-zh** 插件驱动开发流程。
> AI 助手必须在任何操作之前通过 `skill` 工具加载相关技能。

---

## 技能加载规范

**你必须使用 `skill` 工具加载 superpowers-zh 技能，而不是手动总结技能内容。**

技能名称格式：不带前缀，直接用技能名调用 `skill` 工具。

### 可用技能及触发条件

| 触发场景 | 必须调用的技能 |
|----------|---------------|
| 任何创造性工作（新功能、新谜题、新机制） | `brainstorming` |
| 2+ 个可独立进行的任务 | `dispatching-parallel-agents` |
| 执行书面实现计划 | `executing-plans` |
| 在当前会话中执行独立任务 | `subagent-driven-development` |
| 实现完成后决定集成方式 | `finishing-a-development-branch` |
| 需要隔离工作区 | `using-git-worktrees` |
| 遇到 bug、测试失败、异常行为 | `systematic-debugging` |
| 实现功能或修复 bug | `test-driven-development` |
| 宣称完成/修复/测试通过之前 | `verification-before-completion` |
| 完成任务或合并前验证 | `requesting-code-review` |
| 收到审查反馈后 | `receiving-code-review` |
| 移除 AI 生成的代码异味 | `remove-ai-slops` |
| 有规格说明用于多步骤任务 | `writing-plans` |
| 创建/编辑技能 | `writing-skills` |
| 构建 MCP 服务器 | `mcp-builder` |

### 中国特色技能路由（叠加使用，不互斥）

| 场景 | 必须调用的技能 |
|----------|---------------|
| 代码审查且团队使用中文沟通 | `chinese-code-review` |
| 使用 Gitee/Coding/极狐 GitLab | `chinese-git-workflow` |
| 编写中文技术文档或 README | `chinese-documentation` |
| 编写 git commit message（中文项目） | `chinese-commit-conventions` |

### 技能优先级

1. **流程技能优先**（brainstorming、systematic-debugging） — 决定如何处理任务
2. **实现技能其次**（test-driven-development、mcp-builder） — 指导执行

"让我们构建 X" → 先 brainstorming，再使用实现技能。
"修复这个 bug" → 先 systematic-debugging，再使用领域特定技能。

---

## 项目信息

- **游戏名**：解谜游戏16：消失的麻姐
- **类型**：剧情向解谜游戏（Meta叙事）
- **平台**：Web端（PWA），支持PC和手机浏览器
- **核心玩法**：玩家与"数字人麻姐"进行AI对话式探索调查
- **设计文档**：`script/game_design.txt`（v6.0）
- **技术栈**：纯前端 HTML/CSS/JS，无框架，无外部依赖

---

## 红线

- ❌ 不要手动总结技能内容到 AGENTS.md — 用 `skill` 工具加载
- ❌ 不要跳过头脑风暴直接写代码
- ❌ 不要跳过 TDD 直接写实现
- ❌ 不要不做根因调查就提修复方案
- ❌ 不要没有验证证据就宣称完成
