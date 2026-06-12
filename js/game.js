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
