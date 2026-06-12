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
    // cls is registered as its own command now
    'saveclear': 'clear',
    'conclusion': 'conclusions', 'summary': 'conclusions',
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

// === 命令注册 ===

command.register('help', {
  desc: '显示可用命令',
  fn: () => {
    ui.print('当前可用命令：', 'hint');
    ui.print('  help     — 显示帮助', '');
    ui.print('  list     — 查看已解锁证据', '');
    ui.print('  access   — 查看可访问系统', '');
    ui.print('  combine  — 组合分析证据（如 combine E-05+E-18）', '');
    ui.print('  cls      — 清屏（不影响存档）', '');
    ui.print('  clear    — 清除存档（需 clear confirm）', '');
    ui.print('  save     — 保存游戏进度', '');
    ui.print('  load     — 加载游戏进度', '');
  },
});

command.register('list', {
  desc: '查看证据清单',
  fn: () => {
    const state = game.getState();
    if (state.unlockedEvidence.length === 0) {
      ui.print('你还没有解锁任何证据。', 'hint');
      return;
    }
    state.unlockedEvidence.forEach(id => {
      ui.print('[' + id + '] ' + EVIDENCE[id].name, 'evidence');
    });
  },
});

command.register('access', {
  desc: '查看可访问的系统',
  fn: () => {
    if (typeof handleAccessSystem === 'function') {
      const state = game.getState();
      if (state.unlockedSystems.length === 0) {
        ui.print('暂无可访问的系统。', 'hint');
        return;
      }
      ui.print('当前可访问系统：', 'hint');
      state.unlockedSystems.forEach(name => {
        ui.print('  ' + name + ' — ' + (SYSTEM_NAMES[name] || ''), '');
      });
      return;
    }
  },
});

command.register('cls', {
  desc: '清屏',
  fn: () => {
    if (typeof ui.clear === 'function') ui.clear();
  },
});

command.register('combine', {
  desc: '组合分析证据',
  unlockedWhen: (s) => s.unlockedEvidence.length >= 2,
  requiresArgs: true,
  usage: 'combine E-XX+E-YY',
  fn: (args) => {
    handleCombine(args);
  },
});

command.register('save', {
  desc: '保存游戏进度',
  fn: () => {
    saveGame();
  },
});

command.register('load', {
  desc: '加载游戏进度',
  fn: () => {
    if (!hasSaveCheck()) {
      ui.print('没有可用的存档', 'warning');
      return;
    }
    loadGame();
  },
});

command.register('clear', {
  desc: '清除存档（需 clear confirm）',
  requiresArgs: true,
  usage: 'clear confirm',
  fn: (args) => {
    if (args.length > 0 && args[0] === 'confirm') {
      clearSave();
    } else {
      ui.print('用法：clear confirm', 'error');
      ui.print('输入 cls 可以清屏（不影响存档）', 'hint');
    }
  },
});

// OA 子菜单路由命令
command.register('oa', {
  desc: '访问 OA 子系统（1=通讯录 2=聊天 3=邮箱 4=流程）',
  requiresArgs: true,
  usage: 'oa 1 / oa 2 / oa 3 / oa 4 / oa back',
  unlockedWhen: (s) => s.unlockedSystems.includes('OA') && s.currentStage >= 2,
  fn: async (args) => {
    const action = args[0];
    if (action === '1' || action === '2' || action === '3' || action === '4') {
      await handleOASubcommand(action);
    } else if (action === 'back') {
      ui.print('已返回 OA 主菜单。输入 access 查看系统列表。', 'hint');
    } else {
      ui.print('未知 OA 子命令。用法：oa 1 / oa 2 / oa 3 / oa 4 / oa back', 'error');
    }
  },
});
