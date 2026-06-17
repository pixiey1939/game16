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
    ui.print('[新证据已解锁：E-01｜' + EVIDENCE['E-01'].name + ']', 'evidence');
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

  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[SYSTEM] 进入阶段 2：初步调查', 'system');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  await ui.printDialogue('数字麻姐', [
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

async function handleAccessSystem(systemName) {
  var state = game.getState();
  if (!state.unlockedSystems.includes(systemName)) {
    ui.print('系统 "' + systemName + '" 暂未解锁。输入 access 查看已解锁系统列表。', 'error');
    return;
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
    ui.print('━━━ 相册 - 照片列表 ━━━', 'system');
    ui.print('', '');
    ui.print('  1. 06-17 12:20  借条.jpg', '');
    ui.print('  2. 06-17 11:52  健身房环境.mp4', '');
    ui.print('  3. 06-16 19:25  端午礼盒.jpg', '');
    ui.print('  4. 06-16 12:15  工作餐.jpg', '');
    ui.print('  5. 06-15 22:10  瑜伽垫.jpg', '');
    ui.print('  6. 06-15 18:50  猫咪.jpg', '');
    ui.print('  7. 06-14 09:15  早餐.jpg', '');
    ui.print('  8. 06-13 14:30  跑步鞋.jpg', '');
    ui.print('  9. 06-12 17:00  咖啡.jpg', '');
    ui.print(' 10. 06-11 16:45  吉他.jpg', '');
    ui.print('', '');
    ui.print('共约 30 张照片/视频。输入编号查看详情。', 'hint');
    state._currentSystem = '相册';
    state._currentSystemStage = 'menu';
  } else if (systemName === '健身房') {
    runGymSystem();
  } else if (systemName === '信用查询') {
    ui.print('━━━ 信用查询 ━━━', 'system');
    ui.print('  [1] 教练信用', '');
    ui.print('  [2] 郑桥信用', '');
    ui.print('  [3] 网友信用', '');
    ui.print('', '');
    ui.print('用法：credit 1 / credit 2 / credit 3', 'hint');
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
    ui.print('正在读取手机数据...', 'hint');
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
function runGymSystem() {
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
        ui.print('[新结论已解锁：' + cid + '｜' + def.name + ']', 'evidence');
        game.save();
        checkStage4To5();
      }, 1500);
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
    ui.print('  手机：138xxxx8812', '');
    ui.print('  企业微信：liangly', '');
    ui.print('', '');
    ui.print('[常用联系人]', 'important');
    ui.print('  郑桥（高级研发工程师）134xxxx7821 — 工作对接', '');
    ui.print('  邹大雄（健身教练/大怪兽）138xxxx7753', '');
    ui.print('  钱敏（行政部）', '');
    ui.print('  陈立（产品总监）', '');
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
      ui.print('输入 list 查看完整证据，或 combine 组合证据。', 'hint');
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
        ui.print('[新证据已解锁：E-02｜' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-02'].name : 'OA聊天记录') + ']', 'evidence');
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
      ui.print('输入 list 查看完整证据，或 combine 组合证据。', 'hint');
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
        ui.print('[新证据已解锁：E-03｜' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-03'].name : 'OA邮箱') + ']', 'evidence');
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
          '她习惯用简单好记的数字密码——生日、纪念日这类。',
          '试试输入 unlock 解锁手机。',
        ], 'digital-human');
        ui.print('[新证据已解锁：E-03｜' + (typeof EVIDENCE !== 'undefined' ? EVIDENCE['E-03'].name : 'OA邮箱') + ']', 'evidence');
        game.unlockEvidence('E-03');
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

  // Stage 4→5 auto-trigger: after all 4 Combines unlocked
  checkStage4To5();
}

// ============================================================
// 查看证据详情
// ============================================================

async function handleViewEvidence(id) {
  const ev = EVIDENCE[id];
  if (!ev) { ui.print('证据 ' + id + ' 不存在。', 'error'); return; }

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
        ui.print('  [' + date + '] ' + from + ': ' + text, '');
      } else {
        ui.print('  ' + from + ': ' + text, '');
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
    downloadFile('asset/data/door_access_log.xlsx', 'ChumenTech_DoorAccessLog_2026-06-17.xlsx');
    ui.print('[下载完成：ChumenTech_DoorAccessLog_2026-06-17.xlsx]', 'evidence');
  } else if (action === '2') {
    if (!state.unlockedEvidence.includes('E-04') || !state.unlockedEvidence.includes('E-05')) {
      game.unlockEvidence('E-04');
      game.unlockEvidence('E-05');
      ui.print('[新证据已解锁：E-04｜' + EVIDENCE['E-04'].name + ']', 'evidence');
      ui.print('[新证据已解锁：E-05｜' + EVIDENCE['E-05'].name + ']', 'evidence');
      ui.print('', '');
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
      '但是下午 13:55 却有刷卡回公司的记录，且之后没有任何刷卡离开的记录。这里很奇怪！',
    ], 'digital-human');
  }
}

// ============================================================
// 停车场系统 handler
// ============================================================

async function handleParkingSystem(action) {
  var state = game.getState();
  if (action === '1') {
    if (!state.unlockedEvidence.includes('E-06')) {
      game.unlockEvidence('E-06');
      await ui.printDialogue('数字麻姐', [
        '停车场车辆出入记录...让我看看。',
        '共 16 辆车有出入记录。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-06｜' + EVIDENCE['E-06'].name + ']', 'evidence');
      ui.print('', '');
      game.save();
    }
    ui.print('━━━ 车辆出入记录 ━━━', 'system');
    ui.print('', '');
    ui.print('[正在导出停车场日志文件...]', 'hint');
    downloadFile('asset/data/parking_log.xlsx', 'ChumenTech_ParkingLog_2026-06-17.xlsx');
    ui.print('[下载完成：ChumenTech_ParkingLog_2026-06-17.xlsx]', 'evidence');
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
    ui.print('请输入正确的车牌号（如 鄂A·8K329），或回停车场菜单。', 'hint');
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
      e07.data.forEach(function(line) { ui.print('  ' + line, ''); });
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '超市门口的监控拍到了麻姐和一个黑衣年轻男性在交谈。',
        '那个男的身形瘦高，背着一个吉他包。麻姐还递给他一瓶水。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-07｜' + EVIDENCE['E-07'].name + ']', 'evidence');
      game.save();
    } else {
      var e07 = EVIDENCE['E-07'].content;
      ui.print('━━━ 广埠屯惠选超市 - 公共监控（已查询）━━━', 'system');
      e07.data.forEach(function(line) { ui.print('  ' + line, ''); });
    }
  } else if (input.indexOf('洗车') >= 0 || input.indexOf('广捷') >= 0) {
    if (!state.unlockedEvidence.includes('E-08')) {
      game.unlockEvidence('E-08');
      var e08 = EVIDENCE['E-08'].content;
      ui.print('━━━ 广捷洗车（广埠屯店）- 公共监控 ━━━', 'system');
      ui.print('', '');
      e08.data.forEach(function(line) { ui.print('  ' + line, ''); });
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '郑桥在洗车店卫生间待了 30 分钟，非常反常。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-08｜' + EVIDENCE['E-08'].name + ']', 'evidence');
      game.save();
    } else {
      var e08 = EVIDENCE['E-08'].content;
      ui.print('━━━ 广捷洗车（广埠屯店）- 公共监控（已查询）━━━', 'system');
      e08.data.forEach(function(line) { ui.print('  ' + line, ''); });
    }
  } else {
    ui.print('未找到匹配"' + raw.trim() + '"的商户监控记录。', 'error');
    ui.print('目前可查询的商户：含"超市"或"洗车"关键词。', 'hint');
  }
  state._monitorSearch = false;
  return true;
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
      e07.data.forEach(function(line) { ui.print('  ' + line, ''); });
      ui.print('', '');
      ui.print(e07.analysis, 'important');
    } else {
      game.unlockEvidence('E-07');
      await ui.printDialogue('数字麻姐', [
        '超市门口的监控拍到了麻姐和一个黑衣年轻男性在交谈。',
        '那个男的身形瘦高，背着一个吉他包。',
        '麻姐还递给他一瓶水。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-07｜' + EVIDENCE['E-07'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-08')) {
      ui.print('[已解锁] 洗车店监控', 'important');
      var e08 = EVIDENCE['E-08'].content;
      e08.data.forEach(function(line) { ui.print('  ' + line, ''); });
      ui.print('', '');
      ui.print(e08.analysis, 'important');
    } else {
      game.unlockEvidence('E-08');
      await ui.printDialogue('数字麻姐', [
        '郑桥在洗车店的卫生间待了整整 30 分钟。',
        '这太反常了。正常洗车不会去卫生间待这么久。',
        '他可能从卫生间窗户离开，去了别的地方。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-08｜' + EVIDENCE['E-08'].name + ']', 'evidence');
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
      ui.print('  ' + msg.date, '');
      ui.print('  ' + msg.from + ': ' + msg.text, '');
      ui.print('', '');
    });
    await ui.printDialogue('数字麻姐', [
      '麻姐的短信里有大量与 Embrace 的聊天记录。',
      '他们在计划一个见面，就在案发当天。',
      '注意 13:33 的两条消息，是在定位关闭之后发出的。',
      '这两条是同一分钟内互相发的——Embrace 问"你在哪"，麻姐立刻回复。',
      '表面上看像是普通对话，但也可能只是手机放在口袋/桌上的快捷回复。',
      '要判断是否异常，需要结合其他证据。',
    ], 'digital-human');
  } else {
    var item = e12.noise[index - 1];
    if (!item) { ui.print('该短信不存在。', 'error'); return; }
    ui.print('━━━ 短信 - 与 ' + item.sender + ' ━━━', 'system');
    ui.print('', '');
    ui.print('  ' + item.date, '');
    ui.print('  ' + item.text, '');
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
    ui.print('[新证据已解锁：E-12｜' + EVIDENCE['E-12'].name + ']', 'evidence');
    game.save();
  }
  ui.print('', '');
  ui.print('━━━ 短信 - 最近对话 ━━━', 'system');
  ui.print('', '');
  var e12 = EVIDENCE['E-12'].content;
  ui.print('  1. 157****6697            最后消息 06-17 13:33   未读', '');
  for (var i = 0; i < e12.noise.length; i++) {
    var n = e12.noise[i];
    var num = String(i + 2);
    var pad = num.length === 1 ? ' ' : '';
    ui.print('  ' + pad + num + '. ' + n.sender + '  最后消息 ' + n.date + (n.note === '验证码' || n.note === '银行短信' ? '  （' + n.note + '）' : ''), '');
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
      ui.print('[新证据已解锁：E-15｜' + EVIDENCE['E-15'].name + ']', 'evidence');
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
      ui.print('[新证据已解锁：E-16｜' + EVIDENCE['E-16'].name + ']', 'evidence');
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
      ui.print('[新证据已解锁：E-21｜' + EVIDENCE['E-21'].name + ']', 'evidence');
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
// 相册系统 handler
// ============================================================

async function handleAlbumSystem(action) {
  var state = game.getState();
  if (action === '1') {
    if (state.unlockedEvidence.includes('E-13')) {
      ui.print('[已解锁] 借条照片', 'important');
      var e13 = EVIDENCE['E-13'].content;
      ui.print('  借款人：' + e13.borrower, '');
      ui.print('  出借人：' + e13.lender, '');
      ui.print('  金额：' + e13.amount, '');
      ui.print('  日期：' + e13.date + '，到期：' + e13.deadline, '');
      ui.print('', '');
      ui.print(e13.analysis, 'important');
    } else {
      game.unlockEvidence('E-13');
      await ui.printDialogue('数字麻姐', [
        '麻姐的相册里有一张借条照片。',
        '教练邹大雄向她借了 2 万块钱，8 月底到期。',
        '这给了教练一个明确的经济动机。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-13｜' + EVIDENCE['E-13'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-14')) {
      ui.print('[已解锁] 健身房 WiFi 信息', 'important');
      var e14 = EVIDENCE['E-14'].content;
      ui.print('  ' + e14.title + '（' + e14.duration + '）', '');
      ui.print('  描述：' + e14.description, '');
      ui.print('  WiFi: ' + e14.wifi.ssid + ' / 密码：' + e14.wifi.password, '');
      ui.print('', '');
      ui.print(e14.analysis, 'important');
    } else {
      game.unlockEvidence('E-14');
      await ui.printDialogue('数字麻姐', [
        '相册里的这段视频镜头扫到了健身房的 WiFi 信息。',
        '有了这个，我们也许能查看健身房的日志后台。',
        '健身房的系统应该可以解锁了。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-14｜' + EVIDENCE['E-14'].name + ']', 'evidence');
      game.unlockSystem('健身房');
      ui.print('[系统解锁：健身房]', 'evidence');
      game.save();
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
      ui.print('[新证据已解锁：E-17｜' + EVIDENCE['E-17'].name + ']', 'evidence');
      game.unlockSystem('信用查询');
      ui.print('[系统解锁：信用查询]', 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-18')) {
      ui.print('[已解锁] 健身房门禁记录', 'important');
      var e18 = EVIDENCE['E-18'].content;
      e18.records.forEach(function(rec) {
        ui.print('  ' + rec.time + ' ' + rec.memberId + ' ' + rec.name + ' (' + rec.method + ')', '');
      });
      ui.print('', '');
      ui.print(e18.analysis, 'important');
    } else {
      game.unlockEvidence('E-18');
      await ui.printDialogue('数字麻姐', [
        '健身房门禁记录显示麻姐 11:50 进入，但没有出场记录。',
        '而郑桥 11:54 进入，12:18 就出来了，后来又返回了几次。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-18｜' + EVIDENCE['E-18'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '3') {
    if (state.unlockedEvidence.includes('E-19')) {
      ui.print('[已解锁] 健身房监控截图', 'important');
      var e19 = EVIDENCE['E-19'].content;
      ui.print('  ' + e19.title, '');
      e19.appearances.forEach(function(ap) {
        ui.print('  ' + ap.time + ' — ' + ap.description, '');
      });
      ui.print('', '');
      ui.print(e19.analysis, 'important');
    } else {
      game.unlockEvidence('E-19');
      await ui.printDialogue('数字麻姐', [
        '监控截图显示邹大雄多次出现在女更衣室门口。',
        '这太可疑了。他在女更衣室门口徘徊观望了好几次。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-19｜' + EVIDENCE['E-19'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '4') {
    if (state.unlockedEvidence.includes('E-20')) {
      ui.print('[已解锁] 健身房 Wi-Fi 日志', 'important');
      var e20 = EVIDENCE['E-20'].content;
      ui.print('  WiFi: ' + e20.wifi, '');
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
      await ui.printDialogue('数字麻姐', [
        '健身房 WiFi 日志里有一个非常重要的发现。',
        '有人用健身房的网络搜索过"sedative"——镇静剂。',
        '这个 DNS 查询发生在凌晨 6 点，非常可疑。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-20｜' + EVIDENCE['E-20'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '5') {
    if (state.unlockedEvidence.includes('E-20')) {
      var e20 = EVIDENCE['E-20'].content;
      ui.print('━━━ DNS 日志 ━━━', 'system');
      ui.print('', '');
      if (e20.dns) {
        e20.dns.forEach(function(d) {
          ui.print('  ' + d.time + '  ' + d.domain + '  (' + d.note + ')', '');
        });
      }
      ui.print('', '');
      ui.print('注意：06:04 有对镇静剂网站(b2b-sedative.xyz)的查询，来自 MAC 9A:5D:C3:72:E4:18（郑桥手机）。', 'important');
    } else {
      ui.print('请先查看 Wi-Fi 日志解锁相关证据。', 'hint');
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
      var e09 = EVIDENCE['E-09'].content;
      ui.print('  姓名：' + e09.name + '  年龄：' + e09.age, '');
      ui.print('  负债总计：' + e09.debt.total, '');
      if (e09.debt.items) {
        e09.debt.items.forEach(function(item) {
          ui.print('  - ' + item.type + (item.amount ? ' ' + item.amount : '') + (item.status ? ' ' + item.status : ''), '');
        });
      }
      if (e09.behavior) ui.print('  行为：' + e09.behavior, '');
      if (e09.collections) ui.print('  催收：' + e09.collections, '');
      ui.print('', '');
      ui.print(e09.analysis, 'important');
    } else {
      game.unlockEvidence('E-09');
      await ui.printDialogue('数字麻姐', [
        '教练邹大雄的信用记录很糟糕。',
        '',
        '负债约 47 万元，有 5 笔网贷逾期，还有境外赌博转账。',
        '催收电话 3 次，经济动机非常明确。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-09｜' + EVIDENCE['E-09'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '2') {
    if (state.unlockedEvidence.includes('E-10')) {
      ui.print('[已解锁] 郑桥信用记录', 'important');
      var e10 = EVIDENCE['E-10'].content;
      ui.print('  姓名：' + e10.name + '  年龄：' + e10.age, '');
      ui.print('  职业：' + e10.occupation, '');
      ui.print('  入职：' + e10.joinDate, '');
      ui.print('  信用：' + e10.creditStatus, '');
      ui.print('  ' + e10.publicData, '');
      ui.print('', '');
      ui.print(e10.analysis, 'important');
    } else {
      game.unlockEvidence('E-10');
      await ui.printDialogue('数字麻姐', [
        '郑桥的信用记录正常，没有赌博、借贷或诉讼记录。',
        '没有明显的经济动机，但不能排除其他动机。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-10｜' + EVIDENCE['E-10'].name + ']', 'evidence');
      game.save();
    }
  } else if (action === '3') {
    if (state.unlockedEvidence.includes('E-11')) {
      ui.print('[已解锁] 网友信用记录', 'important');
      var e11 = EVIDENCE['E-11'].content;
      ui.print('  姓名：' + e11.name + '  年龄：' + e11.age, '');
      ui.print('  职业：' + e11.occupation, '');
      ui.print('  信用：' + e11.creditStatus, '');
      ui.print('', '');
      ui.print(e11.analysis, 'important');
    } else {
      game.unlockEvidence('E-11');
      await ui.printDialogue('数字麻姐', [
        '网友 Embrace（张英河）是无辜的。',
        '在校大学生，无不良信用记录，无前科。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-11｜' + EVIDENCE['E-11'].name + ']', 'evidence');
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

  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[SYSTEM] 进入阶段 3：手机数据', 'system');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  var state = game.getState();
  if (state.phoneUnlocked) {
    await ui.printDialogue('数字麻姐', [
      '手机已经解锁了。你可以查看短信、微信、相册等数据。',
      '使用 help 查看可用命令。',
    ], 'digital-human');
    return;
  }

  await ui.printDialogue('数字麻姐', [
    '麻姐的手机还在锁屏状态。',
    '她习惯用简单好记的数字密码——生日、纪念日这类。',
    '她习惯用简单好记的数字密码——生日、纪念日这类，比如 unlock + 四位数。',
  ], 'digital-human');
}


function checkStage4To5() {
  var state = game.getState();
  if (state.currentStage >= 5) return;
  if (
    state.combineUnlocked.includes('C-01') &&
    state.combineUnlocked.includes('C-02') &&
    state.combineUnlocked.includes('C-03') &&
    state.combineUnlocked.includes('C-04')
  ) {
    game.setStage(5);
    setTimeout(function() { runStage5(); }, 2000);
  }
}

// ============================================================
// Stage 5: 郑桥介入
// ============================================================

async function runStage5() {
  if (game.hasShownIntro(5)) return;
  game.markStageIntro(5);

  ui.print('[正在追踪访问来源...]', 'error');
  setTimeout(function() {
    ui.print('[来源定位：楚门科技 VPN 出口]', 'error');
    ui.print('', '');
  }, 2000);

  ui.shakeScreen();
  await new Promise(r => setTimeout(r, 2500));
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('[WARNING] 检测到未授权的远程接入！', 'error');
  ui.print('[WARNING] 系统安全协议已触发...', 'error');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  await ui.printDialogue('？？？', [
    '别费劲了。你以为你在查案？你查的是我。',
    '',
    '我是郑桥。麻姐的消失，和你没关系。',
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

  var choice = await ui.displayChoice([
    { label: '接受你的条件', value: 'accept' },
    { label: '拒绝，继续调查', value: 'decline' },
  ], '请做出选择：');

  var state = game.getState();

  if (choice === 'accept') {
    state.playerChoice = 'accept';
    state.endingReached = 'ending1';
    await ui.printDialogue('郑桥', ['明智的选择。', '链接已经发给你了。'], 'zheng-qiao');
    ui.print('', '');
    ui.print('[系统提示：已访问外部链接]', 'system');
    ui.print('[检测到恶意程序植入]', 'error');
    ui.print('', '');
    showEnding('ending1');
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
        showEnding('ending4');
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
    showEnding('ending3');
    game.save();
    return true;
  }

  await ui.printDialogue('郑桥', ['什么意思？'], 'zheng-qiao');
  return false;
}

// ============================================================
// 结局展示
// ============================================================

function showEnding(ending) {
  ui.print('', '');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');

  if (ending === 'ending1') {
    ui.print('  我看到了你的操作。', 'important');
    ui.print('  你接受了他的条件。', '');
    ui.print('', '');
    ui.print('  我已经将所有信息——包括你接受条件的记录——打包上传至警方电子举报平台。', 'important');
    ui.print('', '');
    ui.print('  你和郑桥，都会为自己做的事负责。', 'important');
    ui.print('', '');
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
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
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
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
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
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
    ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
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
  }

  ui.print('', '');
  ui.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'system');
  ui.print('', '');
  ui.print('[游戏结束 — 感谢游玩]', 'system');
  ui.print('输入 clear confirm 清除存档，重新开始游戏。', 'hint');
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
