document.addEventListener('DOMContentLoaded', () => {
  ui.initClock();
  ui.setDigitalStatus(false);

  const input = document.getElementById('command-input');
  const output = document.getElementById('output');

  // 绑定 Enter 键 — 读取输入 → 调 command.dispatch → 清空输入
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      input.value = '';
      if (value) {
        if (ui.resolveAwaitNextCommand && ui.resolveAwaitNextCommand(value)) return;
        ui.print(`> ${value}`, 'system');
        try {
          command.dispatch(value);
        } catch (err) {
          ui.print(`[错误] ${err.message}`, 'error');
          console.error(err);
        }
      }
    }
  });

  // 启动游戏
  setTimeout(async () => {
    // ===== 多周目检测（≥3 个不同结局才能触发 D线）=====
    try {
      var saveRaw = localStorage.getItem('game16-save-v1');
      if (saveRaw) {
        var saveData = JSON.parse(saveRaw);
        var achieved = (saveData.state && saveData.state.endingsAchieved) || [];
        if (achieved.length >= 3) {
          ui.print('[检测到历史会话记录：' + achieved.length + ' 个结局]', 'hint');
          runDLine();
          input.focus();
          return;
        }
      }
    } catch (e) {
      console.warn('多周目检测失败:', e);
    }

    let state = game.getState();

    if (hasSaveCheck()) {
      ui.print('检测到之前的对话记录，正在恢复…', 'hint');
      state.loadingFromSave = true;
      try {
        loadGame();
      } catch (e) {
        ui.print(`[恢复失败] ${e.message}`, 'error');
      }
      // loadGame() 内部重新赋值了 IIFE 闭包的 state 变量
      // 必须重新获取 state 引用才能看到加载后的数据
      state = game.getState();
      state.loadingFromSave = false;
      ui.print('输入 help 查看可用命令', 'hint');
      // 重新触发当前阶段介绍（如果该阶段的 intro 还没显示过）
      try {
        var currentStage = state.currentStage;
        if (currentStage === 2 && !state.stageIntroShown[2]) {
          runStage2();
        } else if (currentStage === 3 && !state.stageIntroShown[3]) {
          runStage3();
        } else if (currentStage === 5 && !state.stageIntroShown[5]) {
          runStage5();
        }
      } catch (e) {
        ui.print(`[阶段恢复错误] ${e.message}`, 'error');
        console.error(e);
      }
    } else {
      try {
        await ui.startScreen();
        await runStage1();
      } catch (e) {
        ui.print(`[启动错误] ${e.message}`, 'error');
        console.error(e);
      }
    }

    // 确保命令输入获得焦点
    input.focus();
  }, 500);
});
