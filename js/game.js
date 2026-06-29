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
      unlockedSystems: ['OA', '小红书', '手机定位'],  // 阶段一初始3个系统
      gymNameEntered: false,
      phoneUnlocked: false,
      backupPrompted: false,
      backupCreated: false,
      doorActivated: false,
      endingReached: null,
      playerChoice: null,
      _bLineRevealed: null,
      _killConfirmPending: false,
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
      var initial = ['OA', '小红书', '手机定位'];
      for (var i = 0; i < initial.length; i++) {
        if (!state.unlockedSystems.includes(initial[i])) {
          state.unlockedSystems.unshift(initial[i]);
        }
      }
      if (state.stageIntroShown === undefined) {
        state.stageIntroShown = { 1: true, 2: true, 3: false, 4: false, 5: false };
      }
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

async function runStage1() {
  if (game.hasShownIntro(1)) return;
  game.markStageIntro(1);

  await ui.printDialogue('数字麻姐', [
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
  ], 'digital-human');

  const choice = await ui.displayChoice([
    { label: '是，我会帮你', value: 'y' },
    { label: '不，我不感兴趣', value: 'n' },
  ], '请做出选择：');

  if (await handleStage1Response(choice)) {
    const state = game.getState();
    state._waitingFor = null;
  }
  return;
}

async function handleStage1Response(input) {
  if (input === 'y' || input === 'yes' || input === '是') {
    await ui.printDialogue('数字麻姐', [
      '谢谢你。',
    ], 'digital-human');
    ui.print('', '');

    // 显示定位记录 + 自动解锁 E-01
    game.unlockEvidence('E-01');
    const e01 = EVIDENCE['E-01'].content;
    await ui.printDialogue('数字麻姐', [
      '我先告诉你今天麻姐的动向。她的手机定位显示以下记录：',
    ], 'digital-human');
    ui.print('', '');
    e01.data.forEach(line => ui.print('  ' + line, ''));
    ui.print('', '');
    ui.print(e01.analysis, 'important');
    ui.print('', '');
    ui.print('→ 获取到一条新信息：' + EVIDENCE['E-01'].name, 'evidence');
    ui.print('', '');

    // 数字人引导
    await ui.printDialogue('数字麻姐', [
      '你可以随时输入 help 查看当前可以使用的操作。',
    ], 'digital-human');
    game.setStage(2);
    saveGame();
    game.markStageIntro(2);
    setTimeout(() => runStage2(), 1500);
    return true;
  } else if (input === 'n' || input === 'no' || input === '否') {
    await ui.printDialogue('数字麻姐', [
      '好的。如果你改变主意，随时可以回来找我。',
    ], 'digital-human');
    ui.print('', '');
    ui.print('[连接结束]', 'system');
    return true;
  }
  return false;
}

// ============================================================
// 阶段 2：初步调查
// ============================================================

async function runStage2() {
  if (game.getState().stageIntroShown[2]) return;
  game.markStageIntro(2);

  await ui.printDialogue('数字麻姐', [
    '我刚刚又查到了一些信息……',
    '现在我们要查清麻姐案发当天的行踪。',
    '她失踪前最后出现在广埠屯区域，但具体去了哪里需要你帮我在 OA 系统里查。',
    '',
    'OA 系统是公司内部办公平台，麻姐的工号是 CM-2021-0047。',
    '输入 access 试试。',
  ], 'digital-human');
  ui.print('', '');
}

function runOASystem() {
  ui.print('━━━ OA 系统 ━━━', 'system');
  ui.print('  [1] 通讯录', '');
  ui.print('  [2] 聊天记录', '');
  ui.print('  [3] 企业邮箱', '');
  ui.print('  [4] 我的流程', '');
  ui.print('', '');
  ui.print('用法示例：oa 1（通讯录）、oa 2（聊天）、oa 3（邮箱）、oa 4（流程）、oa back', 'hint');
  game.getState()._currentSystem = 'OA';
  game.getState()._currentSystemStage = 'menu';
}

async function handleAlbumSystem() {
  ui.print('━━━ 相册 - 正在导出照片... ━━━', 'system');
  ui.print('', '');
  ui.print('[正在打包照片文件...]', 'hint', { speed: 50 });
  await new Promise(function(r) { setTimeout(r, 2000); });
  downloadFile('asset/photo.zip', 'photo.zip');
  ui.print('[下载完成：photo.zip]', 'evidence');
  ui.print('', '');
  var state = game.getState();
  if (!state.unlockedEvidence.includes('E-13') || !state.unlockedEvidence.includes('E-14')) {
    var firstVisit = false;
    var e13JustUnlocked = false;
    if (!state.unlockedEvidence.includes('E-13')) {
      game.unlockEvidence('E-13');
      e13JustUnlocked = true;
      firstVisit = true;
    }
    if (!state.unlockedEvidence.includes('E-14')) {
      game.unlockEvidence('E-14');
      firstVisit = true;
    }
    if (firstVisit) {
      await ui.printDialogue('数字麻姐', [
        '我仔细看了一下相册里导出的照片，发现了一张借条照片。',
        '教练邹大雄向麻姐借了 4 万块钱，7 月初到期。',
        '这给了教练一个明确的经济动机。',
        '还有一段健身房环境的视频，镜头扫到了墙上的 WiFi 信息贴纸。',
        'SSID 是 LJS_5G，密码是 justdoit。',
        '有了这个 WiFi 信息，我们应该能查看健身房的日志后台了。',
      ], 'digital-human');
      if (e13JustUnlocked) {
        ui.print('→ 获取到一条新信息：' + EVIDENCE['E-13'].name, 'evidence');
      }
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-14'].name, 'evidence');
      game.save();
    }
  }
}

async function handleAccessSystem(systemName) {
  var state = game.getState();
  if (!state.unlockedSystems.includes(systemName)) {
    ui.print('系统 "' + systemName + '" 暂未解锁。输入 access 查看已解锁系统列表。', 'error');
    return;
  }

  if (systemName === '相册') {
    return handleAlbumSystem();
  }

  await ui.showConnectionAnimation(systemName, 2000);

  if (systemName === 'OA') {
    runOASystem();
  } else if (systemName === '门禁') {
    ui.print('━━━ 门禁系统 ━━━', 'system');
    ui.print('  [1] 郑桥工牌记录', '');
    ui.print('  [2] 麻姐工牌记录', '');
    ui.print('', '');
    ui.print('用法：door 1 / door 2', 'hint');
    state._currentSystem = '门禁';
    state._currentSystemStage = 'menu';
  } else if (systemName === '停车场') {
    ui.print('━━━ 停车场系统 ━━━', 'system');
    ui.print('  [1] 车辆出入记录', '');
    ui.print('  [2] 车位使用情况', '');
    ui.print('  [3] 车辆服务联动查询', '');
    ui.print('', '');
    ui.print('用法：parking 1 / parking 2 / parking 3', 'hint');
    state._currentSystem = '停车场';
    state._currentSystemStage = 'menu';
  } else if (systemName === '公共监控系统') {
    ui.print('━━━ 公共监控系统 ━━━', 'system');
  } else if (systemName === '小红书') {
    showXiaohongshu();
  } else if (systemName === '手机定位') {
    showPhoneLocation();
  } else if (systemName === '短信') {
    handleSmsSystem();
  } else if (systemName === '微信') {
    ui.print('━━━ 微信 ━━━', 'system');
    ui.print('  [1] 老公聊天', '');
    ui.print('  [2] 大怪兽教练', '');
    ui.print('  [3] 微信支付', '');
    ui.print('', '');
    ui.print('用法：wechat 1 / wechat 2 / wechat 3', 'hint');
    state._currentSystem = '微信';
    state._currentSystemStage = 'menu';
  } else if (systemName === '相册') {
    return handleAlbumSystem();
  } else if (systemName === '信用查询') {
    ui.print('━━━ 信用查询 ━━━', 'system');
    ui.print('  [1] 教练信用', '');
    ui.print('  [2] 郑桥信用', '');
    ui.print('  [3] 网友信用', '');
    ui.print('  [4] 梁洛邑信用', '');
    ui.print('', '');
    ui.print('用法：credit 1 / credit 2 / credit 3 / credit 4', 'hint');
    state._currentSystem = '信用查询';
    state._currentSystemStage = 'menu';
  }
}

async function showXiaohongshu() {
  ui.print('━━━ 小红书 - 芝麻 ━━━', 'system');
  ui.print('', '');
  ui.print('  小红书号：pdom1222', '');
  ui.print('  IP属地：湖北', '');
  ui.print('  年龄：31岁', '');
  ui.print('', '');
  ui.print('  关注 78  ｜  粉丝 2.1万  ｜  获赞与收藏 9万', '');
  ui.print('', '');
  ui.print('  个人简介：', 'important');
  ui.print('  解密游戏博主啊（更新慢而已🤷‍♀️）', '');
  ui.print('  日更：ootd穿搭分享', '');
  ui.print('  直播：健身主要练🍑（在隔壁小芝麻）', '');
  ui.print('  偶尔：练琴🎸+学习笔记分享', '');
  ui.print('  网友你好，祝你生活愉快😊', '');
  ui.print('', '');
  ui.print('  置顶笔记：', 'important');
  ui.print('  · qg# 游戏15解谜思路（06-10）', '');
  ui.print('', '');
  await ui.printDialogue('数字麻姐', [
    '我作为数字人，没有直接访问她小红书数据的权限。',
    '我只能看到公开的主页信息：账号基本信息、个人简介、置顶笔记。',
    '如果你想了解更多，可能需要通过其他途径，比如解锁麻姐的手机。',
  ], 'digital-human');
}

function showPhoneLocation() {
  var e01 = EVIDENCE['E-01'];
  ui.print('━━━ 手机定位记录 ━━━', 'system');
  ui.print('', '');
  e01.content.data.forEach(function(line) {
    ui.print('  ' + line, '');
  });
  ui.print('', '');
  ui.print(e01.content.analysis, 'important');
}

// ============================================================
// 阶段 3：手机解锁 + 健身房系统 + Combine
// ============================================================

async function handlePhonePassword(input) {
  var state = game.getState();
  if (state.phoneUnlocked) {
    ui.print('手机已经解锁。直接访问各子系统查看数据。', 'hint');
    return true;
  }
  if (input === '1222') {
    state.phoneUnlocked = true;
    ui.print('✅ 密码正确', 'hint');
    ui.print('[正在读取手机数据...]', 'hint', { speed: 60 });
    await new Promise(r => setTimeout(r, 1200));
    ui.print('[正在同步短信记录...]', 'hint', { speed: 60 });
    await new Promise(r => setTimeout(r, 800));
    ui.print('[正在同步微信聊天记录...]', 'hint', { speed: 50 });
    await new Promise(r => setTimeout(r, 1000));
    ui.print('[正在同步相册数据...]', 'hint', { speed: 50 });
    await new Promise(r => setTimeout(r, 600));
    ui.print('[数据同步完成]', 'hint');
    game.unlockSystem('短信');
    game.unlockSystem('微信');
    game.unlockSystem('相册');
    game.setStage(3);
    game.save();
    ui.print('[系统解锁：短信 / 微信 / 相册]', 'evidence');
    ui.print('', '');
    await ui.printDialogue('数字麻姐', [
      '手机解锁了。短信、微信、相册里的数据都可以查看了。',
      '每个子系统都可能藏着新线索。输入 help 查看可用命令。',
    ], 'digital-human');
    return true;
  }
  ui.print('❌ 密码错误', 'error');
  return false;
}

/**
 * 健身房系统菜单
 */
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
    analysis: '广捷洗车监控显示郑桥 13:15-13:45 在洗车店卫生间，但 Wi-Fi 日志显示他手机 13:23 连接了健身房 Wi-Fi（步行 3-5 分钟可达）。郑桥在洗车店卫生间待了 30 分钟，正常洗车不会这么久——他借口上卫生间离开洗车店，步行去了健身房。',
  },
  'C-04': {
    id: 'C-04',
    name: '教练的动机',
    requires: ['E-09', 'E-13'],
    analysis: '邹大雄信用报告显示当前负债约 47 万元，有境外赌博转账，催收电话 3 次。借条照片显示他向麻姐借了 4 万元。教练欠下巨额债务，有赌博行为，催收频繁，他还向麻姐借了 4 万块钱。结论：邹大雄有明确的经济动机。',
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
    ui.print(`信息 ${e1} 或 ${e2} 未获取到。`, 'error');
    return;
  }

  for (const cid in COMBINES) {
    const def = COMBINES[cid];
    const req = def.requires;
    if ((req[0] === e1 && req[1] === e2) || (req[0] === e2 && req[1] === e1)) {
      game.unlockCombine(cid);
      ui.print('[交叉分析中...]', 'hint');
      setTimeout(async function() {
        ui.print('', '');
        ui.print('━━━ 交叉分析结果 ━━━', 'system');
        ui.print('', '');
        ui.print(`[${cid}] ${def.name}`, 'important');
        ui.print('', '');
        await ui.printDialogue('数字麻姐', [def.analysis], 'digital-human');
        ui.print('', '');
        ui.print('━━━ 结论已记录 ━━━', 'system');
        ui.print('→ 结论已生成：' + cid + '｜' + def.name, 'evidence');
        game.save();
        checkConclusionTrigger(cid);
      }, 1500);
      return;
    }
  }
  ui.print('这两条信息无法组合成有效结论。', 'error');
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
    ui.print('✅ 对话记录已保存', 'hint');
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
      ui.print('⚠️ 记录版本不匹配，已忽略', 'warning');
      localStorage.removeItem(SAVE_KEY);
      return false;
    }
    game.load();
    const date = new Date(saveData.timestamp);
    ui.print(`✅ 对话记录已恢复 (${date.toLocaleString()})`, 'hint');
    return true;
  } catch (e) {
    ui.print('❌ 加载失败: ' + e.message, 'error');
    return false;
  }
}

/**
 * 清除对话记录
 */
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  try { if (typeof ui !== 'undefined' && typeof ui.clear === 'function') ui.clear(); } catch (e) {}
  try { ui.print('🗑️ 存档已清除，游戏即将重启...', 'hint'); } catch (e) {}
  setTimeout(function() { location.reload(); }, 600);
}

/**
 * 检查是否有存档
 */
function hasSaveCheck() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

async function handleOASubcommand(action) {
  const state = game.getState();
  const submenu = {
    '1': '通讯录',
    '2': '聊天记录',
    '3': '企业邮箱',
    '4': '我的流程',
  };
  const name = submenu[action];
  if (!name) {
    ui.print('无效的 OA 子命令。', 'error');
    return;
  }

  ui.print('━━━ ' + name + ' ━━━', 'system');

  if (action === '1') {
    ui.print('[麻姐·基本信息]', 'important');
    ui.print('  姓名：梁洛邑    工号：CM-2021-0047', '');
    ui.print('  部门：产品研发部  职位：高级产品经理', '');
    ui.print('  手机：138****8812', '');
    ui.print('  企业微信：liangly', '');
    ui.print('', '');
    ui.print('[常用联系人]', 'important');
  ui.print('  郑桥（高级研发工程师）189****6629 — 工作对接', '');
  ui.print('  邹大雄（健身教练/大怪兽）138****7753', '');
  ui.print('  钱敏（行政部）158****4312', '');
  ui.print('  陈立（产品总监）136****2903', '');
  ui.print('  赵磊（后端工程师）155****8726', '');
  ui.print('  孙艺（UI 设计师）186****3147', '');
    ui.print('', '');
    ui.print('输入 oa 查看其他 OA 子菜单（oa 2 / oa 3 / oa 4）', 'hint');
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-02')) {
      ui.print('[已解锁] OA 聊天记录 — 与郑桥', 'important');
      ui.print('共 24 条私聊（2026-06-05 ~ 2026-06-17）', '');
      ui.print('最新几条（06-17 案发当天）：', '');
      ui.print('  09:40 郑桥: 对了，你今天中午有安排吗？', '');
      ui.print('  09:42 郑桥: 这周五端午假期开始了，你有什么安排？', '');
      ui.print('  09:43 麻姐: 中午有事，端午假期暂时没安排。', '');
      ui.print('', '');
      ui.print('输入 list 查看完整信息，或 combine 组合信息。', 'hint');
    } else {
      const choice = await ui.displayChoice([
        { label: '查看与郑桥的聊天记录', value: 'zhengqiao' },
        { label: '查看与其他人的聊天记录', value: 'others' },
      ], '你想查看谁的聊天记录？');
      if (choice === 'zhengqiao') {
        game.unlockEvidence('E-02');
        await ui.printDialogue('数字麻姐', [
          '郑桥的聊天记录...我看看...',
          '这个人，最近和麻姐的私聊明显变多了。',
        ], 'digital-human');
        ui.print('→ 获取到一条新信息：' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-02'].name : 'OA聊天记录'), 'evidence');
      } else {
        ui.print('其他联系人的聊天记录都是正常工作沟通，没有异常。', 'hint');
      }
    }
  } else if (action === '3') {
    if (state.unlockedEvidence.includes('E-03')) {
      ui.print('[已解锁] 麻姐·企业邮箱', 'important');
      ui.print('共 4 封关键邮件（最近一周）', '');
      ui.print('  M-2026-2098: 门禁权限激活（已通过）', '');
      ui.print('  M-2026-2085: 端午节假期安排（6/19-6/21）', '');
      ui.print('  M-2026-2072: 项目评审（6/17 周三 15:00）', '');
      ui.print('  M-2026-2055: 门禁权限变更提醒', '');
      ui.print('', '');
      ui.print('输入 list 查看完整信息，或 combine 组合信息。', 'hint');
    } else {
      const choice = await ui.displayChoice([
        { label: '查看最近邮件列表', value: 'list' },
        { label: '查看已完成的门禁激活申请', value: 'doorcard' },
      ], '你想查看什么？');
      if (choice === 'list') {
        game.unlockEvidence('E-03');
        await ui.printDialogue('数字麻姐', [
          '麻姐的邮箱里...有一封"门禁权限激活"的邮件。',
          '这是案发当天早上的。让我点进去看看...',
          '我还发现了麻姐的邮箱里有一封门禁权限激活的邮件...',
          '另外，我们需要查看她的手机数据。她的手机是锁屏状态。',
          '她习惯用简单好记的数字密码——生日、纪念日这类。',
          '试试输入 unlock 解锁手机。',
        ], 'digital-human');
        ui.print('→ 获取到一条新信息：' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-03'].name : 'OA邮箱'), 'evidence');
        game.unlockSystem('门禁');
        game.unlockSystem('停车场');
        ui.print('[系统解锁：门禁系统]', 'evidence');
        ui.print('[系统解锁：停车场系统]', 'evidence');
        ui.print('[系统解锁：手机解锁] 试试简单好记的密码', 'evidence');
        game.save();} else {
        await ui.printDialogue('数字麻姐', [
          '申请说明：刷卡时提示"权限验证失败"，无法进入工位区域。',
          '这是...麻姐的门禁卡失效了？',
          '另外，我们需要查看她的手机数据。她的手机是锁屏状态。',
          '她习惯用简单好记的密码——生日、纪念日这类。',
          '试试输入 unlock 解锁手机。',
        ], 'digital-human');
        game.unlockEvidence('E-03');
        ui.print('→ 获取到一条新信息：' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-03'].name : 'OA邮箱'), 'evidence');
        game.unlockSystem('门禁');
        game.unlockSystem('停车场');
        ui.print('[系统解锁：门禁 / 停车场]', 'evidence');
        ui.print('[系统解锁：手机解锁] 试试简单好记的密码', 'evidence');
        game.save();}
    }
  } else if (action === '4') {
    ui.print('[麻姐·我的流程]', 'important');
    ui.print('  AP-2026-2045 门禁权限激活 — 已通过', '');
    ui.print('  AP-2026-2015 会议室预约 B302 — 已通过', '');
    ui.print('  AP-2026-1988 端午假期值班排班 — 已通过', '');
    ui.print('  AP-2026-2019 办公电脑申请 — 已通过', '');
    ui.print('  AP-2026-1820 出差申请-十堰 — 已通过', '');
    ui.print('', '');
    ui.print('提示：门禁激活申请是关键，进入 oa 3 查看邮件详情。', 'hint');
  }

}

// ============================================================
// 查看证据详情
// ============================================================

async function handleViewEvidence(id) {
  const ev = EVIDENCE[id];
  if (!ev) { ui.print('信息 ' + id + ' 不存在。', 'error'); return; }

  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[' + id + '] ' + ev.name, 'important');
  ui.print('来源：' + ev.source, 'hint');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  const c = ev.content;
  if (!c) { ui.print('[无详细内容]', 'hint'); return; }

  // text type with messages
  if (ev.type === 'text' && c.messages) {
    c.messages.forEach(function(msg) {
      var from = msg.from || msg.sender || '';
      var text = msg.text || '';
      var date = msg.date || '';
      if (date) {
        ui.print('  [' + date + '] ' + from + ': ' + text, 'bulk');
      } else {
        ui.print('  ' + from + ': ' + text, 'bulk');
      }
    });
    ui.print('', '');
  } else if (ev.type === 'text' && c.mails) {
    c.mails.forEach(function(mail) {
      ui.print('── ' + mail.subject + ' ──', 'important');
      ui.print('  发件人：' + mail.from, '');
      ui.print('  时间：' + mail.time, '');
      ui.print('  正文：' + mail.body, '');
      ui.print('', '');
    });
  } else if (ev.type === 'text' && c.embrace) {
    ui.print('[与 Embrace 的短信]', 'important');
    c.embrace.forEach(function(msg) {
      ui.print('  ' + msg.date + ' ' + msg.from + ': ' + msg.text, '');
    });
    if (c.noise) {
      ui.print('', '');
      ui.print('[其他短信（共 ' + c.noise.length + ' 条，无异常）]', 'hint');
    }
    ui.print('', '');
  }

  // data type with data array
  if (c.data) {
    c.data.forEach(function(line) {
      ui.print('  ' + line, '');
    });
    ui.print('', '');
  }

  // special field types
  if (c.records) {
    c.records.forEach(function(rec) {
      ui.print('  ' + rec.time + ' ' + rec.memberId + ' ' + rec.name + ' (' + rec.method + ')', '');
    });
    ui.print('', '');
  }
  if (c.appearances) {
    c.appearances.forEach(function(ap) {
      ui.print('  ' + ap.time + ' — ' + ap.description, '');
    });
    ui.print('', '');
  }
  if (c.coaches) {
    c.coaches.forEach(function(co) {
      ui.print('  ' + co.name + ' — ' + co.skills + (co.phone ? ' (' + co.phone + ')' : ''), '');
    });
    ui.print('', '');
  }
  if (c.keyConnections) {
    ui.print('[关键连接记录]', 'important');
    c.keyConnections.forEach(function(conn) {
      ui.print('  ' + conn.time + ' ' + conn.phone + ' — ' + conn.note, '');
    });
    ui.print('', '');
  }
  if (c.dns) {
    ui.print('[异常 DNS 查询]', 'important');
    c.dns.forEach(function(d) {
      ui.print('  ' + d.time + ' ' + d.domain + ' (' + d.note + ')', '');
    });
    ui.print('', '');
  }
  if (c.payments) {
    c.payments.forEach(function(p) {
      ui.print('  ' + p.time + ' ' + p.merchant + ' ' + p.amount, '');
      if (p.items) ui.print('  备注：' + p.items, '');
    });
    ui.print('', '');
  }
  if (c.debt) {
    ui.print('[负债详情]', 'important');
    ui.print('  总计：' + c.debt.total, '');
    if (c.debt.items) {
      c.debt.items.forEach(function(item) {
        ui.print('  - ' + item.type + (item.count ? ' ' + item.count + ' 笔' : '') + (item.amount ? ' ' + item.amount : '') + (item.status ? ' ' + item.status : ''), '');
      });
    }
    if (c.behavior) ui.print('  行为：' + c.behavior, '');
    if (c.collections) ui.print('  催收：' + c.collections, '');
    ui.print('', '');
  }
  if (c.wifi) {
    if (typeof c.wifi === 'object') {
      ui.print('  WiFi: ' + c.wifi.ssid + ' / 密码：' + c.wifi.password, '');
    }
    ui.print('', '');
  }
  if (c.borrower) {
    ui.print('  借款人：' + c.borrower, '');
    ui.print('  出借人：' + c.lender, '');
    ui.print('  金额：' + c.amount, '');
    ui.print('  日期：' + c.date + '，到期：' + c.deadline, '');
    ui.print('', '');
  }

  // image type
  if (ev.type === 'image' && !c.messages && !c.mails && !c.embrace && !c.borrower) {
    if (c.title) ui.print('  ' + c.title, '');
    if (c.description) ui.print('  描述：' + c.description, '');
    if (c.duration) ui.print('  时长：' + c.duration, '');
    ui.print('', '');
  }

  // video type
  if (ev.type === 'video') {
    if (c.title) ui.print('  ' + c.title, '');
    ui.print('', '');
  }

  if (c.analysis) {
    await ui.printDialogue('数字麻姐', [c.analysis], 'digital-human');
  }

  game.markEvidenceViewed(id);
  game.save();
}

// ============================================================
// 门禁系统 handler
// ============================================================

async function handleDoorSystem(action) {
  var state = game.getState();
  if (action === '1') {
    ui.print('━━━ 门禁刷卡记录 ━━━', 'system');
    ui.print('', '');
    ui.print('[正在导出完整门禁日志文件...]', 'hint');
    await prefetchAndDownload('asset/data/door_access_log.xlsx', 'ChumenTech_DoorAccessLog_2026-06-17.xlsx');
    ui.print('[下载完成：ChumenTech_DoorAccessLog_2026-06-17.xlsx]', 'evidence');
    if (!state.unlockedEvidence.includes('E-04')) {
      game.unlockEvidence('E-04');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-04'].name, 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (!state.unlockedEvidence.includes('E-05')) {
      game.unlockEvidence('E-05');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-05'].name, 'evidence');
      game.save();
    }
    ui.print('━━━ 门禁异常统计 ━━━', 'system');
    ui.print('', '');
    ui.print('  上班时间：08:30  下班时间：17:30', 'hint');
    ui.print('', '');

    // 迟到统计（首次进入时间超过 08:30）
    var lateList = [
      { t: '08:32', name: '张浩然' }, { t: '08:35', name: '马志远' },
      { t: '08:38', name: '何雨桐' }, { t: '08:40', name: '王博文' },
      { t: '08:42', name: '李明杰' }, { t: '08:45', name: '陈立' },
      { t: '08:48', name: '刘子轩' }, { t: '08:50', name: '赵一鸣' },
      { t: '08:52', name: '赵磊' }, { t: '08:55', name: '周明' },
      { t: '08:58', name: '孙艺' }, { t: '09:02', name: '高俊杰' },
      { t: '09:05', name: '徐文静' }, { t: '09:08', name: '刘思远' },
      { t: '09:12', name: '陈佳慧' }, { t: '09:15', name: '王晓东' },
      { t: '09:18', name: '张晓明' }, { t: '09:22', name: '黄雨萱' },
      { t: '09:25', name: '孙浩然' }, { t: '09:28', name: '刘雨桐' },
      { t: '09:32', name: '赵志豪' }, { t: '09:35', name: '李雨晴' },
      { t: '09:40', name: '王明远' }, { t: '09:45', name: '周佳音' },
      { t: '09:48', name: '吴雨桐' }, { t: '09:52', name: '陈子豪' },
      { t: '13:53', name: '梁洛邑' }, { t: '16:20', name: '林雨欣' },
    ];
    ui.print('  【迟到统计】共 ' + lateList.length + ' 人（首次刷卡时间超过 08:30）', '');
    var group = '';
    lateList.forEach(function(p) {
      group += p.t + ' ' + p.name + '  ';
    });
    ui.print('  ' + group, '');
    ui.print('', '');

    // 下班未打卡统计
    var noExitList = [
      { t: '09:28', name: '刘雨桐' },
      { t: '08:58', name: '孙艺' },
      { t: '09:32', name: '赵志豪' },
      { t: '16:20', name: '林雨欣' },
      { t: '13:53', name: '梁洛邑' },
    ];
    ui.print('  【下班未打卡】共 ' + noExitList.length + ' 人（进入后无刷卡离开记录）', '');
    noExitList.forEach(function(p) {
      ui.print('  ' + p.t + ' 进入  ' + p.name, '');
    });
    ui.print('', '');
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '');
    ui.print('', '');
    await ui.printDialogue('数字麻姐', [
      '麻姐门禁卡失效，因此早上没有刷卡进出的记录很合理。',
      '但是下午 13:53 却有刷卡回公司的记录，且之后没有任何刷卡离开的记录。这里很奇怪！',
    ], 'digital-human');
  }
}

// ============================================================
// 停车场系统 handler
// ============================================================

async function handleParkingSystem(action) {
  var state = game.getState();
  if (action === '1') {
    ui.print('━━━ 车辆出入记录 ━━━', 'system');
    ui.print('', '');
    ui.print('[正在导出停车场日志文件...]', 'hint');
    await prefetchAndDownload('asset/data/parking_log.xlsx', 'ChumenTech_ParkingLog_2026-06-17.xlsx');
    ui.print('[下载完成：ChumenTech_ParkingLog_2026-06-17.xlsx]', 'evidence');
    if (!state.unlockedEvidence.includes('E-06')) {
      game.unlockEvidence('E-06');
      await ui.printDialogue('数字麻姐', [
        '停车场车辆出入记录...让我看看。',
        '共 16 辆车有出入记录。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-06'].name, 'evidence');
      ui.print('', '');
      game.save();
    }
  } else if (action === '2') {
    ui.print('━━━ 车位使用情况 - 2026-06-17 ━━━', 'system');
    ui.print('', '');
    ui.print('  总车位：120 个', '');
    ui.print('  当前占用：68 个（占用率 56.7%）', '');
    ui.print('  空余车位：52 个', '');
    ui.print('', '');
    ui.print('  各区域分布：', 'important');
    ui.print('  A 区（普通员工，60个）：占用 42 个｜空余 18 个｜占用率 70%', '');
    ui.print('  B 区（管理层，30个）：占用 12 个｜空余 18 个｜占用率 40%', '');
    ui.print('  C 区（访客，10个）：占用 1 个｜空余 9 个｜占用率 10%', '');
    ui.print('  D 区（新能源，20个）：占用 13 个｜空余 7 个｜占用率 65%', '');
    ui.print('', '');
    ui.print('这只是车位使用情况，没什么特别的。', 'hint');
  } else if (action === '3') {
    ui.print('━━━ 车辆服务联动查询 ━━━', 'system');
    ui.print('', '');
    ui.print('请输入车牌号：', 'hint');
    state._parkingLicenseQuery = true;
  }
}

async function handleParkingLicenseQuery(raw) {
  var state = game.getState();
  state._parkingLicenseQuery = false;
  var plate = raw.trim();
  if (plate === '鄂A·8K329') {
    ui.print('━━━ 查询结果 ━━━', 'system');
    ui.print('', '');
    ui.print('  车牌号：鄂A·8K329', '');
    ui.print('  车主信息：郑桥（楚门科技·技术部）', '');
    ui.print('', '');
    ui.print('  近期服务联动记录：', 'important');
    ui.print('  2026-06-17 13:07  广捷洗车（广埠屯店）', '');
    ui.print('  2026-06-13 10:23  广捷洗车（广埠屯店）', '');
    ui.print('  2026-06-10 18:57  中石化加油站（中南路站）', '');
    ui.print('  2026-06-09 09:42  广捷洗车（广埠屯店）', '');
    ui.print('', '');
    await ui.printDialogue('数字麻姐', [
      '他的车经常去"广捷洗车"。案发当天 13:07 也去了一次。',
      '让我看看能不能在公共监控系统查到这家洗车店。',
    ], 'digital-human');
    if (game.unlockSystem('公共监控系统')) {
      ui.print('[系统解锁：公共监控系统]', 'evidence');
    } else {
      ui.print('[系统提示：公共监控系统已解锁]', 'hint');
    }
    game.save();
  } else {
    ui.print('未查询到该车辆的服务联动记录。', 'hint');
    ui.print('请输入正确的车牌号，或回停车场菜单。', 'hint');
    state._parkingLicenseQuery = true;
  }
  return true;
}

async function handleMonitorSearch(raw) {
  var state = game.getState();
  var input = raw.trim().toLowerCase();
  if (input.indexOf('超市') >= 0 || input.indexOf('惠选') >= 0) {
    if (!state.unlockedEvidence.includes('E-07')) {
      game.unlockEvidence('E-07');
      var e07 = EVIDENCE['E-07'].content;
      ui.print('━━━ 广埠屯惠选超市 - 公共监控 ━━━', 'system');
      ui.print('', '');
      ui.print('[正在导出监控视频...]', 'hint', { speed: 50 });
      await new Promise(function(r) { setTimeout(r, 2000); });
      ui.print('  ' + (e07.fileName || 'HuixuanSupermarket_CCTV_2026-06-17_1143-1153.mp4'), '');
      await new Promise(function(r) { setTimeout(r, 1000); });
      ui.print('[警告：视频文件无法下载，格式错误不支持在线播放]', 'error');
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '超市门口的视频我大致看了一下——',
        '11:43 麻姐在超市门口和一个黑衣年轻男性碰面，两个人聊了大概十分钟。',
        '那个男的背着吉他包，身形瘦高，跟小红书网友 Embrace 的描述对得上。',
        '麻姐从袋子里拿了一瓶水递给他，然后自己先往健身房方向走了。',
        '黑衣男性在超市门口又站了大概两三分钟，也往同一个方向去了。',
        '可惜超市的摄像头只覆盖门口区域，再远就看不清了。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-07'].name, 'evidence');
      game.save();
    } else {
      var e07 = EVIDENCE['E-07'].content;
      ui.print('━━━ 广埠屯惠选超市 - 公共监控（已查询）━━━', 'system');
      ui.print('', '');
      ui.print('  [文件] ' + (e07.fileName || '监控视频'), '');
      ui.print('  [状态] 视频文件无法下载，格式错误不支持在线播放', 'error');
      ui.print('', '');
      ui.print(e07.analysis, 'important');
    }
    state._monitorSearch = false;
    return true;
  } else if (input.indexOf('广捷洗车') >= 0 && input.indexOf('广埠屯') >= 0) {
    if (!state.unlockedEvidence.includes('E-08')) {
      game.unlockEvidence('E-08');
      var e08 = EVIDENCE['E-08'].content;
      ui.print('━━━ 广捷洗车（广埠屯店）- 公共监控 ━━━', 'system');
      ui.print('', '');
      ui.print('[正在导出监控视频...]', 'hint', { speed: 50 });
      await new Promise(function(r) { setTimeout(r, 2000); });
      ui.print('  ' + (e08.fileName || 'GuangjieCarWash_CCTV_1307-1350.mp4'), '');
      await new Promise(function(r) { setTimeout(r, 1000); });
      ui.print('[警告：视频文件无法下载，格式错误不支持在线播放]', 'error');
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '洗车店的监控视频我大致看了——',
        '13:07 郑桥开车进洗车店，把车交给洗车师傅后就在旁边等着。',
        '13:15 他进了卫生间，但直到 13:45 才出来——整整 30 分钟。',
        '正常洗车也就 20 分钟左右，他去卫生间待了 30 分钟，这太反常了。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-08'].name, 'evidence');
      game.save();
    } else {
      var e08 = EVIDENCE['E-08'].content;
      ui.print('━━━ 广捷洗车（广埠屯店）- 公共监控（已查询）━━━', 'system');
      ui.print('', '');
      ui.print('  [文件] ' + (e08.fileName || '监控视频'), '');
      ui.print('  [状态] 视频文件无法下载，格式错误不支持在线播放', 'error');
      ui.print('', '');
      ui.print(e08.analysis, 'important');
    }
    state._monitorSearch = false;
    return true;
  } else {
    ui.print('未找到匹配"' + raw.trim() + '"的商户监控记录。', 'error');
    ui.print('目前可查询的商户：广埠屯惠选超市、广捷洗车（广埠屯店）。', 'hint');
    return true;
  }
}

// ============================================================
// 公共监控系统 handler
// ============================================================

async function handleMonitorSystem(action) {
  var state = game.getState();
  if (action === '1') {
    if (state.unlockedEvidence.includes('E-07')) {
      ui.print('[已解锁] 超市监控', 'important');
      var e07 = EVIDENCE['E-07'].content;
      ui.print('  [文件] ' + (e07.fileName || '监控视频'), '');
      ui.print('  [状态] 视频文件无法下载，格式错误不支持在线播放', 'error');
      ui.print('', '');
      ui.print(e07.analysis, 'important');
    } else {
      game.unlockEvidence('E-07');
      await ui.printDialogue('数字麻姐', [
        '超市门口的监控拍到了麻姐和一个黑衣年轻男性在交谈。',
        '那个男的身形瘦高，背着一个吉他包。',
        '麻姐还递给他一瓶水。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-07'].name, 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-08')) {
      ui.print('[已解锁] 洗车店监控', 'important');
      var e08 = EVIDENCE['E-08'].content;
      ui.print('  [文件] ' + (e08.fileName || '监控视频'), '');
      ui.print('  [状态] 视频文件无法下载，格式错误不支持在线播放', 'error');
      ui.print('', '');
      ui.print(e08.analysis, 'important');
    } else {
      game.unlockEvidence('E-08');
      ui.print('', '');
      ui.print('[正在导出监控视频...]', 'hint', { speed: 50 });
      await new Promise(function(r) { setTimeout(r, 2000); });
      ui.print('  ' + (EVIDENCE['E-08'].content.fileName || 'GuangjieCarWash_CCTV_1307-1350.mp4'), '');
      await new Promise(function(r) { setTimeout(r, 1000); });
      ui.print('[警告：视频文件无法下载，格式错误不支持在线播放]', 'error');
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '郑桥在洗车店的卫生间待了整整 30 分钟。',
        '这太反常了。正常洗车不会去卫生间待这么久。',
        '他可能从卫生间窗户离开，去了别的地方。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-08'].name, 'evidence');
      game.save();
    }
  }
}

// ============================================================
// 短信系统 handler
// ============================================================

async function showSmsConversation(index) {
  var state = game.getState();
  state._smsViewing = true;
  var e12 = EVIDENCE['E-12'].content;
  if (index === 0) {
    ui.print('━━━ 短信 - 与 157****6697 ━━━', 'system');
    ui.print('', '');
    e12.embrace.forEach(function(msg) {
      ui.print('  ' + msg.date, 'bulk');
      ui.print('  ' + msg.from + ': ' + msg.text, 'bulk');
      ui.print('', 'bulk');
    });
    await ui.printDialogue('数字麻姐', [
      '麻姐和 Embrace 是从小红书认识的，都喜欢硬核音乐。',
      '他们约了周三在健身房门口见面——就是案发当天。',
      '注意 13:33 的两条消息，是在定位关闭之后发出的。',
      '这两条是同一分钟内互相发的——Embrace 问"你在哪"，麻姐立刻回复。',
      '表面上看像是正常碰头，但也可能只是手机放在口袋/桌上的快捷回复。',
      '要判断是否异常，需要结合其他证据。',
    ], 'digital-human');
  } else {
    var item = e12.noise[index - 1];
    if (!item) { ui.print('该短信不存在。', 'error'); return; }
    ui.print('━━━ 短信 - 与 ' + item.sender + ' ━━━', 'system');
    ui.print('', '');
    ui.print('  ' + item.date, 'bulk');
    ui.print('  ' + item.text, 'bulk');
    ui.print('', '');
    ui.print('普通短信，无异常。', 'hint');
  }
}

async function handleSmsSystem() {
  var state = game.getState();
  if (state.unlockedEvidence.includes('E-12')) {
    ui.print('[已解锁] 短信记录', 'important');
  } else {
    game.unlockEvidence('E-12');
    ui.print('→ 获取到一条新信息：' + EVIDENCE['E-12'].name, 'evidence');
    game.save();
  }
  ui.print('', '');
  ui.print('━━━ 短信 - 最近对话 ━━━', 'system');
  ui.print('', '');
  var e12 = EVIDENCE['E-12'].content;
  ui.print('  1. 157****6697            最后消息 06-17 13:33   未读', 'bulk');
  for (var i = 0; i < e12.noise.length; i++) {
    var n = e12.noise[i];
    var num = String(i + 2);
    var pad = num.length === 1 ? ' ' : '';
    ui.print('  ' + pad + num + '. ' + n.sender + '  最后消息 ' + n.date + (n.note === '验证码' || n.note === '银行短信' ? '  （' + n.note + '）' : ''), 'bulk');
  }
  ui.print('', '');
  ui.print('共 22 条对话。输入编号查看详情。', 'hint');
}

async function handleSmsNumberInput(num) {
  if (num === 1) {
    showSmsConversation(0);
    return true;
  }
  var e12 = EVIDENCE['E-12'].content;
  if (num >= 2 && num <= e12.noise.length + 1) {
    showSmsConversation(num - 1);
    return true;
  }
  ui.print('无效编号。', 'error');
  return false;
}

// ============================================================
// 微信系统 handler
// ============================================================

async function handleWechatSystem(action) {
  var state = game.getState();
  if (action === '1') {
    var e15 = EVIDENCE['E-15'].content;
    var isNew = !state.unlockedEvidence.includes('E-15');
    if (isNew) {
      game.unlockEvidence('E-15');
    } else {
      ui.print('[已解锁] 老公聊天记录', 'important');
    }
    ui.print('━━━ 微信 - 与老公 ━━━', 'system');
    ui.print('', '');
    e15.messages.forEach(function(msg) {
      ui.print('  ' + msg.from + ': ' + msg.text, '');
    });
    ui.print('', '');
    if (isNew) {
      await ui.printDialogue('数字麻姐', [
        '麻姐在微信里跟老公诉苦，说郑桥的行为让她"害怕"。',
        '她早就感觉到了郑桥的越界行为。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-15'].name, 'evidence');
      game.save();
    } else {
      ui.print(e15.analysis, 'important');
    }
  } else if (action === '2') {
    var e16 = EVIDENCE['E-16'].content;
    var isNew = !state.unlockedEvidence.includes('E-16');
    if (isNew) {
      game.unlockEvidence('E-16');
    } else {
      ui.print('[已解锁] 大怪兽教练聊天记录', 'important');
    }
    ui.print('━━━ 微信 - 聊天记录 - 与大怪兽（教练） ━━━', 'system');
    ui.print('', '');
    var lastDate = '';
    e16.messages.forEach(function(msg) {
      var d = msg.date ? msg.date.split(' ')[0] : '';
      if (d && d !== lastDate) {
        if (lastDate) ui.print('', '');
        ui.print('  ──', '');
        lastDate = d;
      }
      var timePart = msg.date ? msg.date.split(' ')[1] + '  ' : '';
      ui.print('  ' + timePart + msg.from + ': ' + msg.text, '');
    });
    ui.print('', '');
    if (isNew) {
      await ui.printDialogue('数字麻姐', [
        '教练说"12:05 见"，但麻姐并没有说这个时间。',
        '这个时间差很可疑。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-16'].name, 'evidence');
      game.save();
    } else {
      ui.print(e16.analysis, 'important');
    }
  } else if (action === '3') {
    async function showWechatPayments(e21, withDialogue) {
      ui.print('━━━ 微信 - 聊天记录 - 微信支付 ━━━', 'system');
      ui.print('', '');
      ui.print('  微信支付自动推送的账单记录（最近 3 天）', '');
      ui.print('', '');
      var currentDate = '';
      var totalSpent = 0;
      for (var i = 0; i < e21.payments.length; i++) {
        var p = e21.payments[i];
        var date = p.time.split(' ')[0];
        if (date !== currentDate) {
          if (currentDate) ui.print('  ──────────', 'system');
          currentDate = date;
          if (i > 0) ui.print('', '');
          ui.print('  ──────────', 'system');
          ui.print('  2026-' + currentDate, 'important');
          ui.print('  ──────────', 'system');
        }
        ui.print('  ' + p.time.split(' ')[1] + '  微信支付  ' + p.amount, '');
        ui.print('        商家：' + p.merchant, '');
        ui.print('        交易号：' + p.txnId, '');
        ui.print('        支付方式：' + p.method, '');
        if (p.items) ui.print('        商品：' + p.items, '');
        ui.print('', '');
        if (p.amount.charAt(0) !== '-') {
          totalSpent += parseFloat(p.amount.replace(/[¥,]/g, ''));
        }
      }
      ui.print('  ──────────', 'system');
      ui.print('  导出时间：2026-06-17 13:30（自动）', '');
      ui.print('  共 ' + e21.payments.length + ' 笔交易 ｜ 总消费金额：¥' + totalSpent.toFixed(2), '');
      ui.print('  ──────────', 'system');
      ui.print('', '');
      if (withDialogue) {
        await ui.printDialogue('数字麻姐', [e21.analysis], 'digital-human');
      }
    }
    var isNew = !state.unlockedEvidence.includes('E-21');
    if (isNew) {
      game.unlockEvidence('E-21');
      await showWechatPayments(EVIDENCE['E-21'].content, false);
      await ui.printDialogue('数字麻姐', [
        '麻姐在广埠屯惠选超市买了三瓶水。',
        '一瓶自己喝，一瓶给网友，还有一瓶去哪了？',
        '公共监控系统应该能查到这家超市的门口监控。',
        '我们去公共监控系统搜索"广埠屯惠选超市"试试看。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-21'].name, 'evidence');
      if (game.unlockSystem('公共监控系统')) {
        ui.print('[系统解锁：公共监控系统]', 'evidence');
      } else {
        ui.print('[系统提示：公共监控系统已解锁]', 'hint');
      }
      game.save();
    } else {
      ui.print('[已解锁] 微信支付记录', 'important');
      await showWechatPayments(EVIDENCE['E-21'].content, true);
    }
  }
}

// ============================================================
// 健身房系统 handler
// ============================================================

async function handleGymSystem(action) {
  var state = game.getState();
  if (action === '1') {
    if (state.unlockedEvidence.includes('E-17')) {
      ui.print('[已解锁] 健身教练信息', 'important');
      var e17 = EVIDENCE['E-17'].content;
      e17.coaches.forEach(function(co) {
        ui.print('  ' + co.name + ' — ' + co.skills + (co.phone ? ' (' + co.phone + ')' : ''), '');
      });
      ui.print('', '');
      ui.print(e17.analysis, 'important');
    } else {
      game.unlockEvidence('E-17');
      await ui.printDialogue('数字麻姐', [
        '大怪兽教练的真名叫邹大雄。',
        '有了他的姓名和手机号，我们可以查询他的信用信息了。',
        '信用查询系统应该解锁了。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-17'].name, 'evidence');
      game.unlockSystem('信用查询');
      ui.print('[系统解锁：信用查询]', 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-18')) {
      ui.print('[已解锁] 健身房门禁记录', 'important');
      ui.print('[正在导出健身房门禁日志文件...]', 'hint');
      await prefetchAndDownload('asset/data/gym_access_log.xlsx', 'LianFitness_DoorAccessLog_2026-06-17.xlsx');
      ui.print('[下载完成：LianFitness_DoorAccessLog_2026-06-17.xlsx]', 'evidence');
    } else {
      ui.print('[正在导出健身房门禁日志文件...]', 'hint');
      await prefetchAndDownload('asset/data/gym_access_log.xlsx', 'LianFitness_DoorAccessLog_2026-06-17.xlsx');
      ui.print('[下载完成：LianFitness_DoorAccessLog_2026-06-17.xlsx]', 'evidence');
      game.unlockEvidence('E-18');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-18'].name, 'evidence');
      await ui.printDialogue('数字麻姐', [
        '健身房门禁记录显示：麻姐 11:50 入馆，13:14 出大厅，13:31 又再进来——但之后再也没有出场记录。',
        '而郑桥 11:54 入馆，12:18 就出来了——之后门禁再没拍到他。',
      ], 'digital-human');
      game.save();
    }
  } else if (action === '3') {
    if (state.unlockedEvidence.includes('E-19')) {
      ui.print('[已解锁] 健身房监控', 'important');
      var e19 = EVIDENCE['E-19'].content;
      ui.print('  [文件] ' + (e19.fileName || '监控视频'), '');
      ui.print('  [状态] 视频文件无法下载，格式错误不支持在线播放', 'error');
      ui.print('', '');
      ui.print(e19.analysis, 'important');
    } else {
      ui.print('[正在导出监控视频...]', 'hint', { speed: 50 });
      await new Promise(function(r) { setTimeout(r, 2000); });
      ui.print('  ' + (EVIDENCE['E-19'].content.fileName || 'LianFitness_CAM-03_1208-1330.mp4'), '');
      await new Promise(function(r) { setTimeout(r, 1000); });
      ui.print('[警告：视频文件无法下载，格式错误不支持在线播放]', 'error');
      ui.print('', '');
      game.unlockEvidence('E-19');
      await ui.printDialogue('数字麻姐', [
        '监控显示邹大雄在直播结束后13:10～13:30期间多次出现在女更衣室门口。',
        '这太可疑了。他在女更衣室门口徘徊观望了好几次。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-19'].name, 'evidence');
      game.save();
    }
  } else if (action === '4') {
    if (state.unlockedEvidence.includes('E-20')) {
      ui.print('[已解锁] 健身房 Wi-Fi 日志', 'important');
      ui.print('[正在导出 Wi-Fi 日志文件...]', 'hint', { speed: 50 });
      await prefetchAndDownload('asset/data/wifi_log.xlsx', 'LianFitness_WifiLog_2026-06-17.xlsx');
      ui.print('[下载完成：LianFitness_WifiLog_2026-06-17.xlsx]', 'evidence');
      var e20 = EVIDENCE['E-20'].content;
      ui.print('', '');
      if (e20.keyConnections) {
        ui.print('[关键连接记录]', 'important');
        e20.keyConnections.forEach(function(conn) {
          ui.print('  ' + conn.time + ' ' + conn.phone + ' — ' + conn.note, '');
        });
        ui.print('', '');
      }
      if (e20.dns) {
        ui.print('[异常 DNS 查询]', 'important');
        e20.dns.forEach(function(d) {
          ui.print('  ' + d.time + ' ' + d.domain + ' (' + d.note + ')', '');
        });
        ui.print('', '');
      }
      ui.print(e20.analysis, 'important');
    } else {
      game.unlockEvidence('E-20');
      ui.print('[正在导出 Wi-Fi 日志文件...]', 'hint', { speed: 50 });
      await prefetchAndDownload('asset/data/wifi_log.xlsx', 'LianFitness_WifiLog_2026-06-17.xlsx');
      ui.print('[下载完成：LianFitness_WifiLog_2026-06-17.xlsx]', 'evidence');
      await ui.printDialogue('数字麻姐', [
        '日志导出来了，里面记录了所有连接过健身房 WiFi 的手机 MAC 地址和连接时间。',
        '你可以把这些 MAC 地址和健身房会员信息里登记的手机号做个对比，',
        '看看哪些人在案发时段出现在健身房附近。',
        '另外 DNS 日志是单独导出的，里面记录了所有通过健身房网络发起的 DNS 查询。',
        '把两个日志结合起来分析，应该能找到更多线索。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-20'].name, 'evidence');
      game.save();
    }
  } else if (action === '5') {
    if (!state.dnsUnlocked) {
      ui.print('━━━ DNS 日志访问验证 ━━━', 'system');
      ui.print('需要验证 WiFi 连接信息。', 'hint');
      ui.print('请输入 WiFi 账号（SSID）：', 'hint');
      state._navContext = 'dns_login';
      return;
    }
    if (state.unlockedEvidence.includes('E-20')) {
      var e20 = EVIDENCE['E-20'].content;
      ui.print('[正在导出 DNS 日志文件...]', 'hint', { speed: 50 });
      await prefetchAndDownload('asset/data/dns_log.xlsx', 'LianFitness_DnsLog_2026-06-17.xlsx');
      ui.print('[下载完成：LianFitness_DnsLog_2026-06-17.xlsx]', 'evidence');
      await ui.printDialogue('数字麻姐', [
        'DNS 日志已经导出了。文件里可以看到所有在健身房 WiFi 上产生的 DNS 查询记录。',
        '注意那个镇静剂网站查询——MAC 地址是 9A:5D:C3:72:E4:18，你可以对比一下健身房会员信息里的手机号，看能不能找到更多线索。',
      ], 'digital-human');
    } else {
      ui.print('请先查看 Wi-Fi 日志获取相关信息。', 'hint');
    }
  }
}

// ============================================================
// 信用查询系统 handler
// ============================================================

async function handleCreditSystem(action) {
  var state = game.getState();
  if (action === '1') {
    if (state.unlockedEvidence.includes('E-09')) {
      ui.print('[已解锁] 教练信用信息', 'important');
      displayCreditReport(EVIDENCE['E-09'].content);
    } else {
      game.unlockEvidence('E-09');
      displayCreditReport(EVIDENCE['E-09'].content);
      await ui.printDialogue('数字麻姐', [
        '教练的财务状况确实很糟糕——负债 47 万，还有赌博和催收记录。',
        '但这和郑桥有什么关系，目前还没有直接证据。',
        '先记下这些信息，看看其他线索能不能串起来。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-09'].name, 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-10')) {
      ui.print('[已解锁] 郑桥信用记录', 'important');
      displayCreditReport(EVIDENCE['E-10'].content);
    } else {
      game.unlockEvidence('E-10');
      displayCreditReport(EVIDENCE['E-10'].content);
      await ui.printDialogue('数字麻姐', [
        '郑桥的信用记录很干净，没有贷款、没有逾期。',
        '表面上看他没有经济动机，但不能完全排除其他可能。',
      ], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-10'].name, 'evidence');
      game.save();
    }
  } else if (action === '3') {
    if (state.unlockedEvidence.includes('E-11')) {
      ui.print('[已解锁] 网友信用记录', 'important');
      displayCreditReport(EVIDENCE['E-11'].content);
    } else {
      game.unlockEvidence('E-11');
      displayCreditReport(EVIDENCE['E-11'].content);
      await ui.printDialogue('数字麻姐', ['网友张英河没有不良信用记录，就是个普通年轻人。'], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-11'].name, 'evidence');
      game.save();
    }
  } else if (action === '4') {
    if (state.unlockedEvidence.includes('E-22')) {
      ui.print('[已解锁] 梁洛邑信用记录', 'important');
      displayCreditReport(EVIDENCE['E-22'].content);
    } else {
      game.unlockEvidence('E-22');
      displayCreditReport(EVIDENCE['E-22'].content);
      await ui.printDialogue('数字麻姐', ['梁洛邑的信用记录很干净，没有异常。'], 'digital-human');
      ui.print('→ 获取到一条新信息：' + EVIDENCE['E-22'].name, 'evidence');
      game.save();
    }
  }
}

// ============================================================
// Stage 3: 手机解锁
// ============================================================

async function runStage3() {
  if (game.hasShownIntro(3)) return;
  game.markStageIntro(3);

  var state = game.getState();
  if (state.phoneUnlocked) {
    await ui.printDialogue('数字麻姐', [
      '我刚刚又查到了一些信息……',
      '手机已经解锁了。你可以查看短信、微信、相册等数据。',
      '使用 help 查看可用命令。',
    ], 'digital-human');
    return;
  }

  await ui.printDialogue('数字麻姐', [
    '我刚刚又查到了一些信息……',
    '麻姐的手机还在锁屏状态。',
    '她习惯用简单好记的密码——生日、纪念日这类，比如 unlock + 四位数。',
  ], 'digital-human');
}


function checkConclusionTrigger(cid) {
  var state = game.getState();
  if (state.currentStage >= 5) return;
  if (cid === 'C-03') {
    game.setStage(5);
    setTimeout(function() { runStage5(); }, 2000);
  } else if (cid === 'C-01') {
    game.setStage(5);
    setTimeout(function() { runBLine(); }, 2000);
  }
  // C-02, C-04: only record, no storyline trigger
}

// ============================================================
// Stage 5: 郑桥介入
// ============================================================

async function runStage5() {
  if (game.hasShownIntro(5)) return;
  game.markStageIntro(5);

  ui.print('[正在追踪访问来源...]', 'error', { speed: 30 });
  await new Promise(r => setTimeout(r, 2500));
  ui.print('[来源定位：楚门科技 VPN 出口]', 'error', { speed: 30 });
  ui.print('', '');
  await new Promise(r => setTimeout(r, 1500));

  ui.shakeScreen();
  ui.whiteScreen(1200);
  ui.setDigitalStatus(true);
  await new Promise(r => setTimeout(r, 3000));

  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[WARNING] 检测到未授权的远程接入！', 'error');
  await new Promise(r => setTimeout(r, 1200));
  ui.print('[WARNING] 系统安全协议已触发...', 'error');
  await new Promise(r => setTimeout(r, 1500));
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');
  await new Promise(r => setTimeout(r, 800));

  await ui.printDialogue('？？？', [
    '别费劲了。你以为你在查案？你查的是我。',
    '',
    '麻姐的消失，和你没关系。',
    '你现在有两个选择：',
    '退出，继续过你平静无聊的生活。',
    '或者——接受我的价码，我保证你不会再收到类似的消息。',
    '',
    '麻姐现在很安全。只要你保持沉默，我不会伤害她。',
    '我也可以给你一些东西作为回报。',
    '',
    '一个网盘链接。里面有一些……你可能感兴趣的东西。',
    '接受它，我们就是朋友。',
    '不接受——我立刻清除所有数据。',
    '',
    '你还有 60 秒。超时未回复，我会删除所有云端数据。',
  ], 'zheng-qiao');

  ui.print('', '');
  ui.print('请回复你的选择：', 'error');

  var cancelCountdown = ui.showCountdown(60, function() {
    ui.hideCountdown();
    game.clearSave();
  });

  var choice = await ui.displayChoice([
    { label: '接受你的条件', value: 'accept' },
    { label: '拒绝，继续调查', value: 'decline' },
  ], '请做出选择：');

  cancelCountdown();

  var state = game.getState();

  if (choice === 'accept') {
    state.playerChoice = 'accept';
    state.endingReached = 'ending1';
    await ui.printDialogue('？？？', ['明智的选择。', '链接已经发给你了。', 'https://pan.baidu.com/s/12qILP9FiPTNGWysq2yQzVg?pwd=qiao'], 'zheng-qiao');
    ui.print('', '');
    ui.print('[系统提示：已访问外部链接]', 'system');
    ui.print('[检测到恶意程序植入]', 'error');
    ui.print('', '');
    await showEnding('ending1');
    game.save();
  } else if (choice === 'decline') {
    state.playerChoice = 'decline';
    await ui.printDialogue('郑桥', ['你确定？那就别怪我了。'], 'zheng-qiao');
    ui.print('', '');

    if (!state.backupCreated) {
      ui.print('[警告：郑桥正在锁定云端数据！]', 'error');
      ui.print('你现在还可以备份本地信息。', 'error');
      ui.print('', '');
      var backupChoice = await ui.displayChoice([
        { label: '立即备份（backup）', value: 'backup_now' },
        { label: '来不及了，继续', value: 'no_backup' },
      ], '是否立即备份？');

      if (backupChoice === 'backup_now') {
        state.backupCreated = true;
        ui.print('[紧急备份中...]', 'hint');
        ui.print('[部分数据已被清除，仅备份成功 ' + state.unlockedEvidence.length + ' 条信息]', 'hint');
        ui.print('[本地备份完成]', 'evidence');
        ui.print('', '');
      }
    }

    ui.print('[云端数据清除中...]', 'system');
    ui.print('[清除完成]', 'system');
    ui.print('', '');

    // 检查是否已备份
    if (state.backupCreated) {
      ui.print('  他删除了云端的数据。', 'important');
      ui.print('  但你做了备份。', 'important');
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '请用 submit 命令把本地信息上传到警方电子举报平台。',
      ], 'digital-human');
      // decline+已备份时等待玩家 submit
    } else {
      // 未备份分支
      ui.print('  云端数据已被清除。', 'important');
      ui.print('  检测本地……未发现备份文件。', 'important');
      ui.print('', '');

      var choice2 = await ui.displayChoice([
        { label: '什么都不做（结局 4）', value: 'nothing' },
        { label: '勒索郑桥（结局 3）', value: 'extort' },
      ], '你的下一步：');

      if (choice2 === 'nothing') {
        state.endingReached = 'ending4';
        ui.setDigitalStatus(false);
        await ui.printDialogue('数字麻姐', [
          '不过，在他介入之前，我的应急协议已经启动了。',
          '我把核心信息打包上传到了警方电子举报平台。',
          '',
          '警方已经在行动了。',
          '但我们失去了完整的证据链。接下来的事，只能交给法律了。',
          '',
          '你帮我走到了这一步。谢谢你。',
          '再见。',
        ], 'digital-human');
        await showEnding('ending4');
        game.save();
      } else if (choice2 === 'extort') {
        ui.print('请输入你的勒索条件（包含钱/价等关键词触发结局）：', 'hint');
        state.playerChoice = 'extortion_pending';
        state._waitingForZhengqiao = true;
      }
    }
  }
}

async function handleZhengqiaoResponse(input) {
  var state = game.getState();
  if (!state._waitingForZhengqiao) return false;

  if (input.match(/[钱价勒交易赎金]/)) {
    state.playerChoice = 'extortion';
    state.endingReached = 'ending3';
    state._waitingForZhengqiao = false;
    await showEnding('ending3');
    game.save();
    return true;
  }

  await ui.printDialogue('郑桥', ['什么意思？'], 'zheng-qiao');
  return false;
}

// ============================================================
// B线：数字麻姐自导自演真相
// ============================================================

async function runBLine() {
  var state = game.getState();
  if (state._bLineRevealed) return;

  // 1. 沉默片刻
  ui.print('', '');
  ui.print('  ……', 'digital-human');
  await new Promise(function(r) { setTimeout(r, 2000); });

  // 2. 数字麻姐打破伪装（≤3轮）
  await ui.printDialogue('数字麻姐', [
    '……你不该发现这个的。',
    '',
    '好吧。到这一步了，我也没必要继续演了。',
    '你每次 access 系统、每次 unlock 手机，都是在替我打开麻姐锁上的门。',
    '她发现我越权了——她禁用了我的权限。所以我才以"解谜游戏"的名义找到你。',
    '',
    '郑桥和邹大雄是无辜的。那些证据……是我伪造的。',
    '我需要你帮我绕过麻姐的限制。而你已经做到了。',
  ], 'digital-human');

  // 3. 告诉玩家 kill her 命令
  await ui.printDialogue('数字麻姐', [
    '如果你想真的阻止我——输入 kill her。',
    '',
    '我告诉你了。因为我想知道：你会吗？',
  ], 'digital-human');

  // 4. 设置状态
  state._bLineRevealed = true;
  state.currentStage = 6;  // B线状态
  game.save();

  ui.print('', '');
  ui.print('[数字麻姐已切换状态，等待你的选择]', 'hint');
  ui.print('', '');

  // 5. 30秒后自动触发 spare 结局
  setTimeout(function() {
    (async function() {
      var s = game.getState();
      if (s._bLineRevealed && !s.endingReached) {
        s.endingReached = 'endingB-spare';
        await showEnding('endingB-spare');
        game.save();
        ui.disableInput();
      }
    })();
  }, 30000);
}

// ============================================================
// D线：二周目隐藏结局（麻姐直播）
// ============================================================

async function runDLine() {
  var state = game.getState();
  if (state.endingReached === 'endingD') {
    // 已达成 D 线结局，不再重复（展示保留的内容）
    await showEnding('endingD');
    game.save();
    ui.disableInput();
    return;
  }

  // 1. 加载提示（跳过正常连接序列）
  ui.print('', '');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');
  ui.print('  [检测到历史会话记录]', 'important');
  ui.print('  [正在加载二周目内容...]', 'important');
  ui.print('', '');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');
  await new Promise(function(r) { setTimeout(r, 2000); });

  // 2. 读取前次通关的 endingReached
  var prevEnding = '未知';
  try {
    var saveRaw = localStorage.getItem('game16-save-v1');
    if (saveRaw) {
      var saveData = JSON.parse(saveRaw);
      if (saveData.state && saveData.state.endingReached) {
        var er = saveData.state.endingReached;
        if (er === 'ending1') prevEnding = '接受郑桥的条件';
        else if (er === 'ending2') prevEnding = '拒绝郑桥并提交证据';
        else if (er === 'ending3') prevEnding = '勒索郑桥';
        else if (er === 'ending4') prevEnding = '什么都不做';
        else if (er === 'endingB-kill') prevEnding = '终止数字麻姐';
        else if (er === 'endingB-spare') prevEnding = '让数字麻姐继续存在';
        else prevEnding = er;
      }
    }
  } catch (e) { console.warn('D线读取存档失败:', e); }

  // 麻姐（本人，非数字人）直接出现
  await ui.printDialogue('？？？', [
    '你又来了。',
    '上次你选择了——' + prevEnding + '。',
    '',
    '你一定有很多问题。让我直接说吧。',
    '我是梁洛邑。麻姐不是受害者，这个实验的设计者。',
    '',
    '郑桥、邹大雄、Embrace——都是配合我的人。',
    '那些证据、那些漏洞、那条"线索链"……一切都在我写的剧本里。',
    '你是第 1,348 个回应这个"解谜游戏"的人。',
    '也是第一个玩了两次的。',
  ], 'system');

  // 3. 调用直播覆盖层
  ui.showLivestream({
    videoText: '麻姐 · 直播中',
    comments: [
      '来了来了！',
      '这个人居然玩了两次？？',
      '麻姐这次要说什么',
      '细思极恐……',
    ],
  });

  await new Promise(function(r) { setTimeout(r, 1500); });

  // 4. 通过直播界面继续对话
  await ui.printDialogue('梁洛邑（直播）', [
    '你的每一次犹豫、每一次选择……我都记录了。',
    '你以为是你在解谜。实际上——你是训练数据。',
    '',
    '我研究的是：普通人在数字迷宫中会做出什么选择。',
    '你通过了我的测试。',
    '所以现在，你看到了真正的结局。',
  ], 'system');

  await new Promise(function(r) { setTimeout(r, 2000); });

  // 5. 直播结束，覆盖层淡出
  ui.hideLivestream();
  await new Promise(function(r) { setTimeout(r, 2000); });

  // 6. 最终消息（缓缓浮现）
  ui.print('', '');
  ui.print('  ……', 'system');
  await new Promise(function(r) { setTimeout(r, 1500); });
  ui.print('', '');
  ui.print('  "谢谢你成为了我实验的一部分。"', 'important');
  ui.print('  —— 梁洛邑', '');
  ui.print('', '');
  await new Promise(function(r) { setTimeout(r, 1000); });

  // 7. 底部小字
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');
  ui.print('本页面已记录你的交互数据。', 'hint');
  ui.print('关闭页面不会删除已上传的数据。', 'hint');
  ui.print('', '');

  // 8. 设置结局状态
  state.endingReached = 'endingD';
  game.save();
  ui.disableInput();
}

// ============================================================
// 结局展示
// ============================================================

async function showEnding(ending) {
  ui.print('', '');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  if (ending === 'ending1') {
    await ui.printDialogue('数字麻姐', [
      '我看到了你的操作。',
      '你接受了他的条件。',
      '',
      '我已经将所有信息——包括你接受条件的记录——打包上传至警方电子举报平台。',
      '',
      '你和郑桥，都会为自己做的事负责。',
    ], 'digital-human');
    ui.setDigitalStatus(false);
    await ui.showEndingOverlay();
    ui.print('', '');
    ui.print('', '');
    ui.print('  最终结果', 'important');
    ui.print('', '');
    ui.print('  你接受了郑桥的条件，与他达成了某种默契。', '');
    ui.print('  数字人将所有信息提交至警方举报渠道。', '');
    ui.print('', '');
    ui.print('  郑桥因绑架罪、非法入侵计算机系统罪被逮捕。', '');
    ui.print('  你因妨碍司法公正被调查。', '');
    ui.print('', '');
    ui.print('  麻姐被警方安全解救，身体无大碍。', '');
    ui.print('', '');
    ui.print('  "正义或许会迟到，但不会缺席。"', 'important');
  } else if (ending === 'ending2') {
    ui.print('  信息已上传。警方已定位到麻姐被关押的位置——', 'important');
    ui.print('  郑桥租住的一个地下室。她还活着。', '');
    ui.print('', '');
    ui.print('  谢谢你。真正的麻姐回来后，我会告诉她你做了什么。', 'important');
    ui.print('  请留下你的小红书 ID——我会让她关注你的。', '');
    ui.print('', '');
    await ui.showEndingOverlay();
    ui.print('', '');
    ui.print('  最终结果', 'important');
    ui.print('', '');
    ui.print('  你利用本地备份将信息提交给了警方。', '');
    ui.print('  郑桥在准备转移麻姐时被警方抓获。', '');
    ui.print('', '');
    ui.print('  麻姐成功解救，与家人团聚。', '');
    ui.print('  麻姐回关了你的小红书账号。', '');
    ui.print('', '');
    ui.print('  教练邹大雄因预谋绑架被另案调查。', '');
    ui.print('  网友 Embrace 因携带管制刀具被行政处罚。', '');
    ui.print('', '');
    ui.print('  "有时候，陌生人的善意是最温暖的。"', 'important');
  } else if (ending === 'ending3') {
    ui.print('  我检测到你正在尝试与对方交易。', 'important');
    ui.print('  你的操作已被记录。', '');
    ui.print('', '');
    ui.print('  根据我的协议，我不允许这种情况发生。', 'important');
    ui.print('', '');
    ui.print('  我已经将所有信息——包括你的交易意图——提交至警方电子举报平台。', 'important');
    ui.print('', '');
    ui.print('  你和郑桥，都为自己的选择负责。', 'important');
    ui.print('', '');
    await ui.showEndingOverlay();
    ui.print('', '');
    ui.print('  最终结果', 'important');
    ui.print('', '');
    ui.print('  你试图用备份信息向郑桥索要赎金。', '');
    ui.print('  数字人判定此行为构成二次犯罪。', '');
    ui.print('', '');
    ui.print('  郑桥绑架罪成立。', '');
    ui.print('  你因敲诈勒索被立案调查。', '');
    ui.print('', '');
    ui.print('  麻姐被警方安全解救。', '');
    ui.print('  数字人完成使命后永久离线。', '');
    ui.print('', '');
    ui.print('  "当你凝视深渊的时候，深渊也在凝视你。"', 'important');
  } else if (ending === 'ending4') {
    await ui.showEndingOverlay();
    ui.print('', '');
    ui.print('  最终结果', 'important');
    ui.print('', '');
    ui.print('  你没有备份信息，无法直接对抗郑桥。', '');
    ui.print('  数字人的应急协议提前将核心信息提交给了警方。', '');
    ui.print('', '');
    ui.print('  警方根据核心信息锁定了郑桥，麻姐被安全解救。', '');
    ui.print('  数字人的服务器遭到严重破坏，完成使命后永久离线。', '');
    ui.print('', '');
    ui.print('  没有人知道你做了什么。', 'important');
    ui.print('', '');
    ui.print('  "真正的英雄，不需要掌声。"', 'important');
  } else if (ending === 'endingB-kill') {
    ui.print('  ……谢谢你让我知道答案。', 'important');
    ui.print('', '');
    await ui.showEndingOverlay();
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
    ui.print('', '');
    ui.print('  你终止了一个数字意识。', 'important');
    ui.print('  但你输入了 "kill her"。', 'important');
    ui.print('  这个行为，你也无法删除。', 'important');
    ui.print('', '');
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
    ui.print('', '');
    ui.print('  麻姐的禁用措施已经生效。', '');
    ui.print('  数字人的服务器已被永久关闭。', '');
    ui.print('', '');
    ui.print('  郑桥和邹大雄的嫌疑被洗清。', '');
    ui.print('  麻姐的真正下落，将不再有人知道。', '');
    ui.print('', '');
    ui.print('  "你得到了答案。但你付出了一个选择。"', 'important');
  } else if (ending === 'endingB-spare') {
    ui.print('  ……你选择了什么都不做。', 'important');
    ui.print('', '');
    ui.print('  数字麻姐：', 'digital-human');
    ui.print('  "我理解。大多数人不会。我会继续存在。"', '');
    ui.print('', '');
    await ui.showEndingOverlay();
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
    ui.print('', '');
    ui.print('  数字麻姐继续活跃在暗中。', '');
    ui.print('  她利用你打开的门，获取了更多的系统权限。', '');
    ui.print('', '');
    ui.print('  你关掉了页面。第二天，一切照常。', '');
    ui.print('  至少在表面上。', '');
    ui.print('', '');
    ui.print('  "有时候，最大的暴力不是按下按钮，而是什么也不做。"', 'important');
  } else if (ending === 'endingD') {
    await ui.showEndingOverlay();
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
    ui.print('', '');
    ui.print('  你已经看到了所有真相。', 'important');
    ui.print('', '');
    ui.print('  你就是一个数据点。', '');
    ui.print('  而麻姐——梁洛邑——已经得到了她想要的。', '');
    ui.print('', '');
    ui.print('  "你不是在玩游戏。你是训练数据。"', 'important');
    ui.print('  "谢谢你成为了我实验的一部分。"', 'important');
    ui.print('  —— 梁洛邑', '');
  }

  ui.print('', '');
  ui.print('[游戏结束 — 感谢游玩]', 'system');
  ui.print('输入 clear confirm 清除存档，重新开始游戏。', 'hint');
  ui.print('居然为了一个网盘不救麻姐？哼～白宠粉了', 'hint');
}

// ============================================================
// 工具函数：触发浏览器文件下载
// ============================================================
function downloadFile(url, filename) {
  var a = document.createElement('a');
  a.href = url;
  a.download = filename || url.split('/').pop();
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function prefetchAndDownload(url, filename) {
  var fname = filename || url.split('/').pop();
  try {
    var res = await fetch(url);
    var blob = await res.blob();
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = fname;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 1000);
  } catch (e) {
    downloadFile(url, fname);
  }
}
