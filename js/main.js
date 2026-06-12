document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('output');
  output.innerHTML = '<div class="line digital-human">[终端初始化...]</div>';
  setTimeout(() => {
    output.innerHTML += '<div class="line digital-human">[连接成功]</div>';

    const state = game.getState();

    if (hasSaveCheck()) {
      ui.print('检测到存档', 'hint');
      state.loadingFromSave = true;
      loadGame();
      state.loadingFromSave = false;
      ui.print(`当前阶段：${state.currentStage}`, 'hint');
      ui.print(`已解锁证据：${state.unlockedEvidence.length}/21`, 'hint');
      ui.print('输入 help 查看所有命令', 'hint');
    } else {
      runStage1();
    }
  }, 500);
});
