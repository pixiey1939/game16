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

// === 命令注册 ===

command.register('help', {
  desc: '显示可用命令',
  fn: () => {
    ui.print('当前可用命令：', 'hint');
    ui.print('  help    — 显示帮助', '');
    ui.print('  list    — 查看已解锁证据', '');
    ui.print('  access  — 查看可访问系统', '');
    ui.print('  clear   — 清屏', '');
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

command.register('clear', {
  desc: '清屏',
  fn: () => {
    if (typeof ui.clear === 'function') ui.clear();
  },
});

command.register('y', {
  desc: '确认（Y）',
  fn: () => {
    const state = game.getState();
    if (state._waitingFor === 'stage1-yesno') {
      handleStage1Response('y');
      state._waitingFor = null;
    } else {
      ui.print('输入 help 查看可用命令。', 'hint');
    }
  },
});

command.register('n', {
  desc: '否定（N）',
  fn: () => {
    const state = game.getState();
    if (state._waitingFor === 'stage1-yesno') {
      handleStage1Response('n');
      state._waitingFor = null;
    } else {
      ui.print('输入 help 查看可用命令。', 'hint');
    }
  },
});
