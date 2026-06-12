// GAME 16 — 游戏引擎
// 职责：GameState 管理、阶段逻辑、Combine、Ending、持久化

const SAVE_KEY = 'game16-save-v1';
const VERSION = '1.0.0';

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
