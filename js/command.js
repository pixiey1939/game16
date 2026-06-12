// GAME 16 — 命令分发
// 解析玩家输入、路由到对应处理函数

const command = (() => {
  // 命令注册表
  const commands = {};

  // 别名映射
  const aliases = {
    '?': 'help', 'h': 'help',
    'l': 'list', 'ls': 'list',
    'a': 'access', 'enter': 'access',
    'c': 'combine',
    'cls': 'clear',
    'conclusion': 'conclusions', 'summary': 'conclusions',
    'save': 'backup', 'b': 'backup',
  };

  /**
   * 注册一个命令
   */
  function register(name, def) {
    commands[name] = def;
  }

  /**
   * 解析玩家输入，返回 { cmd, args, raw } 或 null
   */
  function parseInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(/\s+/);
    let cmd = parts[0].toLowerCase();
    if (aliases[cmd]) cmd = aliases[cmd];
    return { cmd, args: parts.slice(1), raw: trimmed };
  }

  /**
   * 派发：解析 → 解锁检查 → args 检查 → 调用 fn → 自动保存
   */
  function dispatch(input) {
    const parsed = parseInput(input);
    if (!parsed) return;

    const state = game.getState();
    state.totalCommands++;

    const def = commands[parsed.cmd];
    if (!def) {
      ui.print(`未知命令：${parsed.cmd}`, 'error');
      ui.print('输入 help 查看可用命令。', 'hint');
      return;
    }

    if (def.unlockedWhen && !def.unlockedWhen(state)) {
      ui.print('该命令暂未解锁。', 'error');
      return;
    }

    if (def.requiresArgs && parsed.args.length === 0) {
      ui.print(`命令 ${parsed.cmd} 需要参数。用法：${def.usage || parsed.cmd}`, 'error');
      return;
    }

    def.fn(parsed.args, parsed.raw);
    game.save();  // 每次命令后自动保存
  }

  return { register, parseInput, dispatch };
})();
