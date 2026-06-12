// GAME 16 — 游戏引擎
// 职责：GameState 管理、阶段逻辑、Combine、Ending、持久化

const SAVE_KEY = 'game16-save-v1';
const VERSION = '1.0.0';

// ============================================================
// game IIFE
// ============================================================

const game = (() => {
  // 初始状态
  function freshState() {
    return {
      currentStage: 1,
      stageIntroShown: { 1: false, 2: false, 3: false, 4: false, 5: false },
      unlockedEvidence: [],
      evidenceViewed: {},
      combineUnlocked: [],
      unlockedSystems: ['OA'],  // OA 初始可用
      gymNameEntered: false,
      phoneUnlocked: false,
      backupPrompted: false,
      backupCreated: false,
      endingReached: null,
      playerChoice: null,
      startTime: Date.now(),
      saveTime: 0,
      totalCommands: 0,
      version: VERSION,
    };
  }

  let state = freshState();

  function getState() { return state; }
  function resetState() { state = freshState(); return state; }

  // 持久化
  function save() {
    try {
      state.saveTime = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state, version: VERSION }));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== VERSION) {
        console.warn('Save version mismatch, ignoring');
        return null;
      }
      state = data.state;
      return state;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
  function deleteSave() { localStorage.removeItem(SAVE_KEY); }

  // 证据操作
  function unlockEvidence(id) {
    if (state.unlockedEvidence.includes(id)) return false;
    state.unlockedEvidence.push(id);
    return true;
  }

  function markEvidenceViewed(id) {
    state.evidenceViewed[id] = true;
  }

  // 系统解锁
  function unlockSystem(name) {
    if (state.unlockedSystems.includes(name)) return false;
    state.unlockedSystems.push(name);
    return true;
  }

  // Combine
  function unlockCombine(id) {
    if (state.combineUnlocked.includes(id)) return false;
    state.combineUnlocked.push(id);
    return true;
  }

  // 阶段
  function setStage(n) { state.currentStage = n; }
  function markStageIntro(n) { state.stageIntroShown[n] = true; }
  function hasShownIntro(n) { return !!state.stageIntroShown[n]; }

  return {
    freshState, getState, resetState,
    save, load, hasSave, deleteSave,
    unlockEvidence, markEvidenceViewed,
    unlockSystem, unlockCombine,
    setStage, markStageIntro, hasShownIntro,
  };
})();

// ============================================================
// 阶段 1：引入
// ============================================================

function runStage1() {
  if (game.hasShownIntro(1)) return;
  game.markStageIntro(1);

  const greeting = [
    '你好，网友。我是麻姐的数字人，她亲手训练我用于辅助她的工作和生活。',
    '',
    '从今天下午 13:30 之后，我突然无法联系到麻姐了。她的手机定位被手动关闭，',
    '所有社交账号同时停止更新。我试过她能联系的所有方式，都没有回应。',
    '',
    '我的权限有限，只能访问部分工作数据和公开信息，无法获取所有我需要的内容。',
    '所以我创建了这个系统，以"解谜游戏"的名义向麻姐的粉丝求助。',
    '如果你愿意帮助我，我会尽量把所有信息展示给你。',
    '',
    '我需要你的帮助。你愿意帮我吗？',
  ];
  greeting.forEach(line => ui.print(line, 'digital-human'));
  ui.print('', '');
  ui.print('  y = 是，n = 否', 'hint');
  ui.print('', '');

  game.getState()._waitingFor = 'stage1-yesno';
}

function handleStage1Response(input) {
  if (input === 'y' || input === 'yes' || input === '是') {
    ui.print('谢谢你。', 'digital-human');
    ui.print('', '');

    // 显示定位记录 + 自动解锁 E-01
    game.unlockEvidence('E-01');
    const e01 = EVIDENCE['E-01'].content;
    ui.print('我先告诉你今天麻姐的动向。她的手机定位显示以下记录：', 'digital-human');
    ui.print('', '');
    e01.data.forEach(line => ui.print('  ' + line, ''));
    ui.print('', '');
    ui.print(e01.analysis, 'important');
    ui.print('', '');
    ui.print('[新证据已解锁：E-01｜' + EVIDENCE['E-01'].name + ']', 'evidence');
    ui.print('', '');

    // 数字人引导
    ui.print('你可以随时输入 help 查看当前可以使用的操作。', 'digital-human');
    game.setStage(2);
    saveGame();
    game.markStageIntro(2);
    setTimeout(() => runStage2(), 1500);
    return true;
  } else if (input === 'n' || input === 'no' || input === '否') {
    ui.print('好的。如果你改变主意，随时可以回来找我。', 'digital-human');
    ui.print('', '');
    ui.print('[连接结束]', 'system');
    return true;
  }
  return false;
}

// ============================================================
// 阶段 2：初步调查
// ============================================================

function runStage2() {
  if (game.getState().stageIntroShown[2]) return;
  game.markStageIntro(2);

  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[SYSTEM] 进入阶段 2：初步调查', 'system');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  ui.print('现在我们要查清麻姐案发当天的行踪。', 'digital-human');
  ui.print('她失踪前最后出现在广埠屯区域，但具体去了哪里需要你帮我在 OA 系统里查。', 'digital-human');
  ui.print('', '');
  ui.print('OA 系统是公司内部办公平台，麻姐的工号是 CM-2021-0047。', 'digital-human');
  ui.print('输入 access 试试。', 'digital-human');
  ui.print('', '');
}

function runOASystem() {
  ui.print('━━━ OA 系统 ━━━', 'system');
  ui.print('  [1] 通讯录', '');
  ui.print('  [2] 聊天记录', '');
  ui.print('  [3] 企业邮箱', '');
  ui.print('  [4] 我的流程', '');
  ui.print('', '');
  ui.print('输入编号 1-4，或 back 返回主菜单。', 'hint');
  game.getState()._currentSystem = 'OA';
  game.getState()._currentSystemStage = 'menu';
}

function handleAccessSystem(systemName) {
  const state = game.getState();
  if (!state.unlockedSystems.includes(systemName)) {
    ui.print('系统 "' + systemName + '" 暂未解锁。输入 access 查看已解锁系统列表。', 'error');
    return;
  }

  // 路由到具体系统
  if (systemName === 'OA') {
    runOASystem();
  }
  // ... 其他系统后续扩展
}

// ============================================================
// 等待输入处理入口
// ============================================================

function handleWaitingInput(input) {
  const state = game.getState();
  const waitingFor = state._waitingFor;
  if (!waitingFor) return false;

  if (waitingFor === 'stage1-yesno') {
    if (handleStage1Response(input)) {
      state._waitingFor = null;
      return true;
    }
    return false;
  }

  return false;
}

// ============================================================
// 阶段 3：手机解锁 + 健身房系统 + Combine
// ============================================================

/**
 * 处理手机密码输入
 * @param {string} input - 玩家输入的密码
 */
function handlePhonePassword(input) {
  if (input === '1222') {
    game.getState().phoneUnlocked = true;
    ui.print('✅ 密码正确', 'hint');
    ui.print('正在读取手机数据...', 'hint');
    // 解锁 E-12～E-14（任务描述未展开，见 commit 说明）
    game.unlockEvidence('E-12');
    game.unlockEvidence('E-13');
    game.unlockEvidence('E-14');
    game.save();
    return true;
  }
  ui.print('❌ 密码错误', 'error');
  return false;
}

/**
 * 健身房系统菜单
 */
function runGymSystem() {
  ui.print('━━━ 炼健身 ━━━', 'system');
  ui.print('  [1] 教练信息', '');
  ui.print('  [2] 门禁记录', '');
  ui.print('  [3] 监控截图', '');
  ui.print('  [4] Wi-Fi 日志', '');
  ui.print('', '');
  ui.print('输入编号 1-4，或 back 返回主菜单。', 'hint');
  game.getState()._currentSystem = '健身房';
  game.getState()._currentSystemStage = 'menu';
}

/**
 * Combine 配置
 */
const COMBINES = {
  'C-01': {
    id: 'C-01',
    name: '麻姐的消失地点矛盾',
    requires: ['E-05', 'E-18'],
    analysis: '公司门禁显示麻姐 13:53 进入公司，但健身房门禁没有她的出场记录。她不可能同时出现在两个地方。结论：有人复制了她的工牌。',
  },
  'C-02': {
    id: 'C-02',
    name: '网友 Embrace 的地点矛盾',
    requires: ['E-12', 'E-20'],
    analysis: '短信聊天记录中 Embrace 说他在健身房门口等麻姐，但 Wi-Fi 日志显示 13:15-13:35 期间他一直连接健身房 Wi-Fi。从超市到健身房走路要 15 分钟，如果他去吃饭了，Wi-Fi 不可能一直在。结论：Embrace 没有离开过健身房附近。',
  },
  'C-03': {
    id: 'C-03',
    name: '郑桥的地点矛盾',
    requires: ['E-08', 'E-20'],
    analysis: '广捷洗车监控显示郑桥 13:15-13:45 在洗车店卫生间，但 Wi-Fi 日志显示他手机 13:21 连接了健身房 Wi-Fi（距离 5 分钟车程）。洗车店到健身房 5 分钟车程，他不可能同时在两地。结论：郑桥 13:15 借口上卫生间，从窗户离开洗车店去了健身房。',
  },
  'C-04': {
    id: 'C-04',
    name: '教练的动机',
    requires: ['E-09', 'E-13'],
    analysis: '邹大雄信用报告显示当前负债约 47 万元，有境外赌博转账，催收电话 3 次。借条照片显示他向麻姐借了 2 万元。教练欠下巨额债务，有赌博行为，催收频繁，他还向麻姐借了 2 万块钱。结论：邹大雄有明确的经济动机。',
  },
};

/**
 * 处理 Combine 输入
 * @param {string[]} args - 玩家输入的参数（如 ["E-05+E-18"]）
 */
function handleCombine(args) {
  if (args.length !== 1) {
    ui.print('用法：combine E-XX+E-YY', 'error');
    return;
  }
  const input = args[0];
  const match = input.match(/^E-(\d+)[+]E-(\d+)$/);
  if (!match) {
    ui.print('格式错误。请输入如：combine E-05+E-18', 'error');
    return;
  }
  const e1 = `E-${match[1].padStart(2, '0')}`;
  const e2 = `E-${match[2].padStart(2, '0')}`;

  const state = game.getState();
  if (!state.unlockedEvidence.includes(e1) || !state.unlockedEvidence.includes(e2)) {
    ui.print(`证据 ${e1} 或 ${e2} 未解锁。`, 'error');
    return;
  }

  for (const cid in COMBINES) {
    const def = COMBINES[cid];
    const req = def.requires;
    if ((req[0] === e1 && req[1] === e2) || (req[0] === e2 && req[1] === e1)) {
      game.unlockCombine(cid);
      ui.print('[新结论已生成]', 'evidence');
      ui.print('', '');
      ui.print(`[${cid}] ${def.name}`, 'important');
      ui.print('', '');
      ui.print(def.analysis, '');
      ui.print('', '');
      game.save();
      return;
    }
  }
  ui.print('这两个证据无法生成有效结论。', 'error');
}

// ============================================================
// localStorage 持久化存档系统（Task 8）
// ============================================================

/**
 * 保存游戏状态到 localStorage
 */
function saveGame() {
  try {
    const state = game.getState();
    const saveData = {
      version: VERSION,
      timestamp: Date.now(),
      state: state,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    ui.print('✅ 游戏已保存', 'hint');
    return true;
  } catch (e) {
    ui.print('❌ 保存失败: ' + e.message, 'error');
    return false;
  }
}

/**
 * 从 localStorage 加载游戏状态
 */
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return false;
    }
    const saveData = JSON.parse(raw);
    if (saveData.version !== VERSION) {
      ui.print('⚠️ 存档版本不匹配，已忽略', 'warning');
      localStorage.removeItem(SAVE_KEY);
      return false;
    }
    game.load();
    const date = new Date(saveData.timestamp);
    ui.print(`✅ 存档已加载 (${date.toLocaleString()})`, 'hint');
    return true;
  } catch (e) {
    ui.print('❌ 加载失败: ' + e.message, 'error');
    return false;
  }
}

/**
 * 清除存档
 */
function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  ui.print('🗑️ 存档已清除', 'hint');
}

/**
 * 检查是否有存档
 */
function hasSaveCheck() {
  return localStorage.getItem(SAVE_KEY) !== null;
}
