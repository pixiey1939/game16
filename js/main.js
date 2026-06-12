document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('output');
  output.innerHTML = '<div class="line digital-human">[终端初始化...]</div>';
  setTimeout(() => {
    output.innerHTML += '<div class="line digital-human">[连接成功]</div>';
  }, 500);
});
