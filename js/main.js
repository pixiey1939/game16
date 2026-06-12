document.addEventListener('DOMContentLoaded', () => {
  ui.initClock();

  const input = document.getElementById('command-input');
  const output = document.getElementById('output');

  // 绑定 Enter 键 — 读取输入 → 调 command.dispatch → 清空输入
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      input.value = '';
      if (value) {
        // 把用户输入回显到输出区
        ui.print(`> ${value}`, 'system');
        // 执行命令
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
    const state = game.getState();

    if (hasSaveCheck()) {
      ui.print('检测到存档', 'hint');
      state.loadingFromSave = true;
      try {
        loadGame();
      } catch (e) {
        ui.print(`[加载失败] ${e.message}`, 'error');
      }
      state.loadingFromSave = false;
      ui.print(`当前阶段：${state.currentStage}`, 'hint');
      ui.print(`已解锁证据：${state.unlockedEvidence.length}/21`, 'hint');
      ui.print('输入 help 查看所有命令', 'hint');
    } else {
      try {
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
