// GAME 16 — 命令分发（状态机 + 编号导航架构）
// 解析玩家输入、基于上下文路由到对应处理函数

var command = (function () {
  var commands = {};

  var aliases = {
    "?": "help",
    "h": "help",
    "l": "list",
    "ls": "list",
    "a": "access",
    "c": "combine",
    "cls": "cls",
    "saveclear": "clear",
    "conclusion": "conclusions",
    "summary": "conclusions",
    "b": "backup",
  };

  var SYSTEM_LIST = [
    { name: 'OA 系统', key: 'OA', desc: '公司内部办公系统' },
    { name: '小红书', key: '小红书', desc: '麻姐的公开账号信息' },
    { name: '手机定位', key: '手机定位', desc: '麻姐案发当天的定位记录' },
    { name: '门禁系统', key: '门禁', desc: '公司门禁刷卡记录' },
    { name: '停车场系统', key: '停车场', desc: '公司停车场出入记录' },
    { name: '公共监控系统', key: '公共监控系统', desc: '商家公共监控接口' },
    { name: '短信', key: '短信', desc: '麻姐手机的短信记录' },
    { name: '微信', key: '微信', desc: '麻姐手机的微信记录' },
    { name: '相册', key: '相册', desc: '麻姐手机的相册记录' },
    { name: '健身房', key: '健身房', desc: '炼健身会员系统' },
    { name: '信用查询', key: '信用查询', desc: '个人信用查询系统' },
  ];

  function register(name, def) {
    commands[name] = def;
  }

  function parseInput(raw) {
    var trimmed = raw.trim();
    if (!trimmed) return null;
    var parts = trimmed.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    if (aliases[cmd]) cmd = aliases[cmd];
    return { cmd: cmd, args: parts.slice(1), raw: trimmed };
  }

  function getNavItems(ctx) {
    var state = game.getState();
    if (!ctx) {
      var items = [];
      var count = 0;
      for (var i = 0; i < SYSTEM_LIST.length; i++) {
        var sys = SYSTEM_LIST[i];
        if (state.unlockedSystems.indexOf(sys.key) >= 0) {
          count++;
          items.push({ num: count, label: sys.name, desc: sys.desc, key: sys.key });
        }
      }
      return items;
    }
    if (ctx === 'OA') {
      return [
        { num: 1, label: '通讯录', desc: '公司员工信息', next: 'OA.contacts' },
        { num: 2, label: '聊天记录', desc: '工作沟通记录', next: 'OA.chat' },
        { num: 3, label: '企业邮箱', desc: '收件箱', next: 'OA.email' },
        { num: 4, label: '我的流程', desc: '各项流程', next: 'OA.workflow' },
      ];
    }
    if (ctx === 'OA.contacts') return null;
    if (ctx === 'OA.workflow') {
      return [
        { num: 1, label: 'AP-2026-2045 门禁权限激活申请（已通过）', next: 'OA.workflow.1' },
        { num: 2, label: 'AP-2026-2015 会议室预约 B302（已通过）', next: 'OA.workflow.2' },
        { num: 3, label: 'AP-2026-1988 端午假期值班排班（已通过）', next: 'OA.workflow.3' },
        { num: 4, label: 'AP-2026-2019 办公电脑申请（已通过）', next: 'OA.workflow.4' },
        { num: 5, label: 'AP-2026-1820 出差申请-十堰（已通过）', next: 'OA.workflow.5' },
      ];
    }
    if (ctx === 'OA.chat.zhengqiao') return null;
    if (ctx === 'OA.chat.chenli') return null;
    if (ctx === 'OA.chat.qianmin') return null;
    if (ctx === 'OA.chat.zhaolei') return null;
    if (ctx === 'OA.chat.sunyi') return null;
    if (ctx === 'OA.email.1') return null;
    if (ctx === 'OA.email.2') return null;
    if (ctx === 'OA.email.3') return null;
    if (ctx === 'OA.email.4') return null;
    if (ctx === 'OA.email.5') return null;
    if (ctx === 'OA.email.6') return null;
    if (ctx === 'OA.email.7') return null;
    if (ctx === 'OA.email.8') return null;
    if (ctx === 'OA.email.9') return null;
    if (ctx === 'OA.email.10') return null;
    if (ctx === 'door.1') return null;
    if (ctx === 'door.2') return null;
    if (ctx === 'parking.1') return null;
    if (ctx === 'parking.2') return null;
    if (ctx === 'parking.3') return null;
    if (ctx === 'sms.1') return null;
    if (ctx === 'wechat.chat.dashou') return null;
    if (ctx === 'wechat.pay') return null;
    if (ctx === 'wechat.mini.1') return null;
    if (ctx === 'wechat.mini.2') return null;
    if (ctx === 'wechat.mini.3') return null;
    if (ctx === 'album.1') return null;
    if (ctx === 'album.2') return null;
    if (ctx === 'gym.1') return null;
    if (ctx === 'gym.2') return null;
    if (ctx === 'gym.3') return null;
    if (ctx === 'gym.4') return null;
    if (ctx === 'credit.1') return null;
    if (ctx === 'credit.2') return null;
    if (ctx === 'credit.3') return null;
    if (ctx === 'phone_unlock'||ctx==='gym_login'||ctx==='gym_login_pwd'||ctx==='wechat_mini_program'||ctx==='credit_query') return null;
    if (ctx === 'OA.chat') {
      return [
        { num: 1, label: '郑桥（高级研发工程师）', desc: '06-17 09:42', next: 'OA.chat.zhengqiao' },
        { num: 2, label: '陈立（产品总监）', desc: '06-16 16:35', next: 'OA.chat.chenli' },
        { num: 3, label: '钱敏（行政部）', desc: '06-16 16:30', next: 'OA.chat.qianmin' },
        { num: 4, label: '赵磊（后端工程师）', desc: '06-10 14:15', next: 'OA.chat.zhaolei' },
        { num: 5, label: '孙艺（UI 设计师）', desc: '06-07 10:40', next: 'OA.chat.sunyi' },
      ];
    }
    if (ctx === 'OA.email') {
      var state = game.getState();
      var items = [];
      var count = 0;
      if (state.doorActivated) {
        count++; items.push({ num: count, label: 'M-2098 门禁权限激活申请（已通过）', desc: '系统通知 · 06-17', next: 'OA.email.1' });
      }
      count++; items.push({ num: count, label: 'M-2085 端午节假期安排', desc: '钱敏 · 06-16', next: 'OA.email.2' });
      count++; items.push({ num: count, label: 'M-2072 第24周产品研发部工作汇总', desc: '陈立 · 06-16', next: 'OA.email.3' });
      count++; items.push({ num: count, label: 'M-2055 工位区域门禁权限变更提醒', desc: '系统通知 · 06-14', next: 'OA.email.4' });
      count++; items.push({ num: count, label: 'M-2068 6月17日项目评审', desc: '陈立 · 06-15', next: 'OA.email.5' });
      count++; items.push({ num: count, label: 'M-2062 端午节礼品领取通知', desc: '钱敏 · 06-15', next: 'OA.email.6' });
      count++; items.push({ num: count, label: 'M-2048 人脸采集最后通知', desc: '钱敏 · 06-16', next: 'OA.email.7' });
      count++; items.push({ num: count, label: 'M-2042 会议室预约 B302', desc: '系统通知 · 06-13', next: 'OA.email.8' });
      count++; items.push({ num: count, label: 'M-2033 5-28评审会议纪要', desc: '陈立 · 06-11', next: 'OA.email.9' });
      count++; items.push({ num: count, label: 'M-2028 端午节值班表已发布', desc: '钱敏 · 06-16', next: 'OA.email.10' });
      return items;
    }
    if (ctx === '门禁') {
      return [
        { num: 1, label: '门禁刷卡记录', next: 'door.1' },
        { num: 2, label: '异常刷卡记录', next: 'door.2' },
      ];
    }
    if (ctx === '停车场') {
      return [
        { num: 1, label: '车辆出入记录', next: 'parking.1' },
        { num: 2, label: '车位使用情况', next: 'parking.2' },
        { num: 3, label: '车辆服务联动查询', next: 'parking.3' },
      ];
    }
    if (ctx === '公共监控系统' || ctx === 'public_monitor_list') {
      return null;
    }
    if (ctx === '短信') { return null; }
    if (ctx === '微信') {
      return [
        { num: 1, label: '聊天记录', desc: '对话列表', next: 'wechat.chat' },
        { num: 2, label: '小程序', next: 'wechat.apps' },
        { num: 3, label: '朋友圈' },
      ];
    }
    if (ctx === 'wechat.apps') {
      var state2 = game.getState();
      if (state2.miniProgramAuthed) {
        var items2 = [
          { num: 1, label: '炼健身小程序', next: 'wechat.mprog.enter' },
        ];
        if (state2.gymAdminDiscovered) {
          items2.push({ num: 2, label: '炼健身管理后台', next: 'wechat.gymadmin.enter' });
        }
        return items2;
      }
      ui.print('  请输入小程序名称搜索：', 'hint');
      return [];
    }
    if (ctx === 'wechat.chat') {
      return [
        { num: 1, label: '大怪兽', desc: '06-17 12:00', next: 'wechat.chat.dashou' },
        { num: 2, label: '产品研发部工作群', desc: '06-16 16:35' },
        { num: 3, label: '老公', desc: '06-07 22:32', next: 'wechat.chat.laogong' },
        { num: 4, label: '姐妹群（4人）', desc: '06-13' },
        { num: 5, label: '妈妈', desc: '06-10' },
        { num: 6, label: '普拉提佩佩', desc: '06-17 10:20' },
        { num: 7, label: '微信支付', desc: '06-17 11:43', next: 'wechat.pay' },
        { num: 8, label: '文件传输助手', desc: '06-16 14:20' },
        { num: 9, label: '老板', desc: '06-16 18:45' },
        { num: 10, label: '57', desc: '06-13 22:15' },
        { num: 11, label: '美团外卖', desc: '06-12 12:05' },
      ];
    }
    if (ctx === 'wechat.mprog') {
      return [
        { num: 1, label: '基本信息', next: 'wechat.mprog.1' },
        { num: 2, label: '教练团队', next: 'wechat.mprog.2' },
        { num: 3, label: '我的课程', next: 'wechat.mprog.3' },
      ];
    }
    if (ctx === 'wechat.gymadmin') {
      return [
        { num: 1, label: '门禁记录', next: 'gymadmin.1' },
        { num: 2, label: '监控记录', next: 'gymadmin.2' },
        { num: 3, label: 'Wi-Fi 日志', next: 'gymadmin.3' },
        { num: 4, label: 'DNS 日志', next: 'gymadmin.4' },
      ];
    }
    if (ctx === '相册') {
      return [
        { num: 1, label: '借条.jpg', desc: '06-17', next: 'album.1' },
        { num: 2, label: '健身房环境.mp4', desc: '06-17', next: 'album.2' },
        { num: 3, label: '端午礼盒.jpg', desc: '06-16' },
        { num: 4, label: '工作餐.jpg', desc: '06-16' },
        { num: 5, label: '瑜伽垫.jpg', desc: '06-15' },
        { num: 6, label: '猫咪.jpg', desc: '06-15' },
        { num: 7, label: '早餐.jpg', desc: '06-14' },
        { num: 8, label: '跑步鞋.jpg', desc: '06-13' },
        { num: 9, label: '咖啡.jpg', desc: '06-12' },
        { num: 10, label: '吉他.jpg', desc: '06-11' },
      ];
    }
    if (ctx === '健身房') {
      return [
        { num: 1, label: '基本信息', next: 'gym.1' },
        { num: 2, label: '教练团队', next: 'gym.2' },
        { num: 3, label: '我的课程', next: 'gym.3' },
      ];
    }
    if (ctx === '信用查询') {
      return null;
    }
    return null;
  }

  function resolveNavByNumber(ctx, num) {
    var items = getNavItems(ctx);
    if (!items) return null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].num === num) return items[i];
    }
    return null;
  }

  function resolveNavByName(ctx, input) {
    var items = getNavItems(ctx);
    if (!items) return null;
    var lower = input.toLowerCase();
    for (var i = 0; i < items.length; i++) {
      var label = items[i].label.toLowerCase();
      if (label.indexOf(lower) >= 0 || lower.indexOf(label) >= 0) return items[i];
      if (items[i].key) {
        var key = items[i].key.toLowerCase();
        if (key === lower || key.indexOf(lower) >= 0 || lower.indexOf(key) >= 0) return items[i];
      }
    }
    if (!ctx) {
      var m = {
        'oa':'OA 系统','oa系统':'OA 系统','小红书':'小红书',
        '手机':'手机定位','手机定位':'手机定位',
        '门禁':'门禁系统','门禁系统':'门禁系统',
        '停车场':'停车场系统','停车场系统':'停车场系统',
        '监控':'公共监控系统','公共监控':'公共监控系统','公共监控系统':'公共监控系统',
        '短信':'短信','微信':'微信','相册':'相册',
        '健身':'健身房','健身房':'健身房','炼健身':'健身房',
        '信用':'信用查询','信用查询':'信用查询',
      };
      if (m[lower]) {
        for (var j = 0; j < items.length; j++) {
          if (items[j].label === m[lower]) return items[j];
        }
      }
    }
    return null;
  }

  function getCtxParent(ctx) {
    if (!ctx) return null;
    var parts = ctx.split('.');
    if (parts.length <= 1) {
      if (ctx === 'OA.contacts'||ctx==='OA.chat'||ctx==='OA.email'||ctx==='OA.workflow') return 'OA';
      return null;
    }
    parts.pop();
    var p = parts.join('.');
    if (p === 'OA') return p;
    if (ctx==='door.1'||ctx==='door.2') return '门禁';
    if (ctx.startsWith('parking.')) return '停车场';
    if (ctx.startsWith('sms.')) return '短信';
    if (ctx.startsWith('wechat.')) return '微信';
    if (ctx.startsWith('album.')) return '相册';
    if (ctx.startsWith('gym.')) return '健身房';
    if (ctx.startsWith('credit.')) return '信用查询';
    if (p==='OA'||p==='door'||p==='parking'||p==='sms'||p==='wechat'||p==='album'||p==='gym'||p==='credit') return p;
    return null;
  }

  function showNavMenu() {
    var state = game.getState();
    var ctx = state._navContext || null;
    if (!ctx) {
      var items = getNavItems(ctx);
      if (!items) return;
      ui.print('当前可访问系统：', 'hint');
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var name = it.label || it.name || '';
        var pad = name.length<=5?'        ':name.length<=7?'      ':name.length<=9?'    ':'  ';
        ui.print('  ' + it.num + '. ' + name + pad + it.desc, '');
      }
      ui.print('请输入编号或名称进入对应系统：', 'hint');
      return;
    }
    var labels = {'OA':'OA 系统','门禁':'门禁系统','停车场':'停车场系统','微信':'微信','健身房':'健身房','信用查询':'信用查询','短信':'短信','相册':'相册','公共监控系统':'公共监控系统','小红书':'小红书','手机定位':'手机定位','OA.chat':'OA - 聊天记录','OA.email':'OA - 企业邮箱','OA.contacts':'OA - 通讯录','OA.workflow':'OA - 我的流程','wechat.chat':'微信 - 聊天记录','wechat.apps':'微信 - 小程序','wechat.mprog':'微信 - 炼·健身小程序','wechat.gymadmin':'微信 - 炼·健身管理后台'};
    var label = labels[ctx] || ctx;
    ui.print('━━━ ' + label + ' ━━━', 'system');

    if (ctx === '公共监控系统' || ctx === 'public_monitor_list') {
      ui.print('', '');
      ui.print('请输入商户名称搜索监控记录：', 'hint');
      game.getState()._monitorSearch = true;
      return;
    }

    if (ctx === 'wechat_mini_program') {
      ui.print('', '');
      ui.print('请输入小程序名称搜索：', 'hint');
      return;
    }

    if (ctx === '信用查询') {
      ui.print('', '');
      ui.print('请输入"姓名+手机号"查询个人信用：', 'hint');
      ui.print('  示例：邹大雄 138xxxx7753', 'hint');
      game.getState()._creditQuery = true;
      return;
    }

    if (ctx === '短信') {
      handleSmsSystem();
      return;
    }

    var items = getNavItems(ctx);
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      ui.print('  [' + items[i].num + '] ' + items[i].label, '');
    }
    ui.print('', '');
    ui.print('输入编号或名称查看详情，输入 back 返回。', 'hint');
  }

  function handleNumberInput(num, raw) {
    var state = game.getState();
    var ctx = state._navContext || null;
    if (ctx === 'phone_unlock') return handlePhonePassword(raw);
    if (ctx === 'wechat_mini_program') {
      return handleWechatMiniSearch(raw);
    }
    if (ctx === 'credit_query') return handleCreditQuery(raw);
    if (ctx === '短信') return handleSmsNumberInput(num);
    var target = resolveNavByNumber(ctx, num);
    if (!target) { ui.print("无效编号。", "error"); return false; }
    return doNavigate(ctx, target);
  }

  async function doNavigate(ctx, target) {
    var state = game.getState();
    var next = target.next || null;
    if (!ctx && target.key) {
      return doEnterSystem(target.key);
    }
    if (next === 'OA.contacts') {
      state._navContext = next;
      showOAContacts();
      return true;
    }
    if (next === 'OA.chat.zhengqiao') {
      state._navContext = next;
      showOAChatZhengqiao();
      return true;
    }
    if (next === 'OA.chat.chenli') {
      state._navContext = next;
      showOAChatChenli();
      return true;
    }
    if (next === 'OA.chat.qianmin') {
      state._navContext = next;
      showOAChatQianmin();
      return true;
    }
    if (next === 'OA.chat.zhaolei') {
      state._navContext = next;
      showOAChatZhaolei();
      return true;
    }
    if (next === 'OA.chat.sunyi') {
      state._navContext = next;
      showOAChatSunyi();
      return true;
    }
    if (next === 'OA.email.1') {
      state._navContext = next;
      showOAEmailByIndex(0);
      return true;
    }
    if (next === 'OA.email.2') {
      state._navContext = next;
      showOAEmailByIndex(1);
      return true;
    }
    if (next === 'OA.email.3') {
      state._navContext = next;
      showOAEmailByIndex(2);
      return true;
    }
    if (next === 'OA.email.4') {
      state._navContext = next;
      showOAEmailByIndex(3);
      return true;
    }
    if (next === 'OA.email.5') {
      state._navContext = next;
      showOAEmailByIndex(4);
      return true;
    }
    if (next === 'OA.email.6') {
      state._navContext = next;
      showOAEmailByIndex(5);
      return true;
    }
    if (next === 'OA.email.7') {
      state._navContext = next;
      showOAEmailByIndex(6);
      return true;
    }
    if (next === 'OA.email.8') {
      state._navContext = next;
      showOAEmailByIndex(7);
      return true;
    }
    if (next === 'OA.email.9') {
      state._navContext = next;
      showOAEmailByIndex(8);
      return true;
    }
    if (next === 'OA.email.10') {
      state._navContext = next;
      showOAEmailByIndex(9);
      return true;
    }
    if (next === 'OA.workflow.1') {
      state._navContext = next;
      showOAWorkflow1();
      return true;
    }
    if (next === 'OA.workflow.2'||next==='OA.workflow.3'||next==='OA.workflow.4'||next==='OA.workflow.5') {
      state._navContext = next;
      ui.print('该流程为日常审批，无异常。', 'hint');
      return true;
    }
    if (next === 'door.1') {
      state._navContext = 'door.1';
      handleDoorSystem("1");
      return true;
    }
    if (next === 'door.2') {
      state._navContext = 'door.2';
      handleDoorSystem("2");
      return true;
    }
    if (next === 'parking.1') {
      state._navContext = 'parking.1';
      handleParkingSystem('1');
      return true;
    }
    if (next === 'parking.2') {
      state._navContext = 'parking.2';
      handleParkingSystem('2');
      return true;
    }
    if (next === 'parking.3') {
      state._navContext = 'parking.3';
      handleParkingSystem('3');
      return true;
    }
    if (ctx === '公共监控系统' || ctx === 'public_monitor_list') {
      return false;
    }
    if (next === 'sms.1') {
      state._navContext = '短信';
      handleSmsSystem();
      return true;
    }
    if (next === 'wechat.chat.dashou') {
      state._navContext = 'wechat.chat';
      handleWechatSystem("2");
      return true;
    }
    if (next === 'wechat.chat.laogong') {
      state._navContext = 'wechat.chat';
      handleWechatSystem("1");
      return true;
    }
    if (next === 'wechat.pay') {
      state._navContext = 'wechat.chat';
      handleWechatSystem("3");
      return true;
    }
    if (next === 'wechat.chat') {
      state._navContext = next;
      showNavMenu();
      return true;
    }
    if (ctx === '微信' && !next) {
      var label = target.label;
      if (label.indexOf('朋友圈') >= 0) {
        await ui.printDialogue('数字麻姐', ['想得美，麻姐撤回一个朋友圈😝'], 'digital-human');
        return true;
      }
      return false;
    }
    if (ctx === 'wechat.chat' && !next) {
      var label = target.label;
      if (label.indexOf('产品研发') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 产品研发部工作群（5人） ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-16 ───', 'hint');
        ui.print('  16:30 陈立: @所有人 周三下午3点B302评审，赵总主持，端午前上线方案V4.0', '');
        ui.print('  16:32 赵磊: 后端接口文档下午发出来', '');
        ui.print('  16:33 郑桥: 技术方案已准备好', '');
        ui.print('  16:35 麻姐: PRD终版和原型图已更新，明早发邮箱', '');
        ui.print('  16:36 孙艺: UI设计稿周四下班前', '');
        ui.print('', '');
        ui.print('─── 06-15 ───', 'hint');
        ui.print('  14:05 陈立: 端午前上线方案评审安排已发邮件，请查收', '');
        ui.print('  14:08 麻姐: 收到', '');
        ui.print('  14:10 郑桥: 收到', '');
        ui.print('', '');
        await ui.printDialogue('数字麻姐', ['工作群聊天，都是正常的工作沟通。'], 'digital-human');
        return true;
      }
      if (label.indexOf('姐妹') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 姐妹群（4人） ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-13 ───', 'hint');
        ui.print('  12:30 小美: 周末去哪玩呀？', '');
        ui.print('  12:32 麻姐: 端午再说吧，最近太忙了', '');
        ui.print('  12:33 阿月: 那端午节一起吃饭！', '');
        ui.print('', '');
        ui.print('姐妹群闲聊，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('妈妈') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 妈妈 ━━━', 'system');
        ui.print('  ⚠️ 该对话最后消息 06-10，不在导出范围内', 'warning');
        ui.print('', '');
        ui.print('  06-10 15:18 妈妈: 端午回来吗？', '');
        ui.print('  06-10 15:20 麻姐: 这次假期短，下次吧妈', '');
        ui.print('', '');
        ui.print('跟妈妈的聊天，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('普拉提') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 普拉提佩佩 ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-17 ───', 'hint');
        ui.print('  10:15 佩佩: 麻姐！周六的普拉提课你来不来？', '');
        ui.print('  10:17 麻姐: 来吧来吧，几点？', '');
        ui.print('  10:18 佩佩: 下午两点，老地方', '');
        ui.print('  10:19 麻姐: 好嘞！', '');
        ui.print('  10:20 佩佩: 记得带瑜伽垫～上次那个蓝色的', '');
        ui.print('  10:20 麻姐: 知道啦', '');
        ui.print('', '');
        ui.print('约课聊天，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('文件') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 文件传输助手 ━━━', 'system');
        ui.print('', '');
        ui.print('  06-16 14:20  [文件] 端午上线方案_V3.0.pdf', '');
        ui.print('  06-15 09:30  [文件] PRD_终版_v4.docx', '');
        ui.print('  06-14 16:45  [文件] 评审会议纪要.xlsx', '');
        ui.print('  06-13 11:20  [文件] 端午值班表.xlsx', '');
        ui.print('  06-12 15:30  [文件] 产品路线图_Q3.png', '');
        ui.print('', '');
        ui.print('工作文件传输，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('老板') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 老板（赵总） ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-16 ───', 'hint');
        ui.print('  18:40 赵总: 洛邑，周三评审你有把握吗？', '');
        ui.print('  18:41 麻姐: 赵总好，没问题的，PRD和数据都准备好了', '');
        ui.print('  18:43 赵总: 好，辛苦了。赵磊那边接口对完了吧？', '');
        ui.print('  18:45 麻姐: 已经对接完了，他下午会发出文档', '');
        ui.print('', '');
        ui.print('跟老板的工作汇报，无异常。', 'hint');
        return true;
      }
      if (label === '57') {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 57 ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-13 ───', 'hint');
        ui.print('  22:00 57: 你看了昨晚那个金属乐队的新MV吗？', '');
        ui.print('  22:03 麻姐: 看了看了！吉他riff太炸了', '');
        ui.print('  22:05 57: 对吧！我扒了一下午都没扒下来', '');
        ui.print('  22:06 麻姐: 哈哈你是不是卡在bridge那段', '');
        ui.print('  22:08 57: 你怎么知道的！！', '');
        ui.print('  22:09 麻姐: 因为我也卡在那了😂', '');
        ui.print('  22:10 57: 对了吉他弦到了吗？上次帮你代购的', '');
        ui.print('  22:12 麻姐: 到了到了！手感超好', '');
        ui.print('  22:13 57: 哈哈就知道你会喜欢，Elixir的磷青铜弦', '');
        ui.print('  22:14 麻姐: 下次直播用新弦试试', '');
        ui.print('  22:14 57: 记得开播喊我', '');
        ui.print('  22:15 麻姐: 必须的～', '');
        ui.print('', '');
        ui.print('音乐爱好者聊天，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('美团') >= 0) {
        state._navContext = 'wechat.chat';
        ui.print('━━━ 美团外卖 ━━━', 'system');
        ui.print('', '');
        ui.print('─── 06-12 ───', 'hint');
        ui.print('  12:00 [订单通知] 您的外卖已送达', '');
        ui.print('  11:15 [优惠] 限时红包满30减8', '');
        ui.print('', '');
        ui.print('─── 06-11 ───', 'hint');
        ui.print('  12:15 [订单通知] 骑手已取餐', '');
        ui.print('', '');
        ui.print('外卖通知，无异常。', 'hint');
        return true;
      }
      return false;
    }
    if (next === 'wechat.mprog.enter') {
      var ws = game.getState();
      if (!ws.miniProgramAuthed) {
        ui.print('请输入小程序名称搜索：', 'hint');
        ws._waitingForMiniProgramSearch = true;
        game.getState()._navContext = 'wechat_mini_program';
        return true;
      }
      state._navContext = 'wechat.mprog';
      showNavMenu();
      return true;
    }
    if (next === 'wechat.mprog.1') {
      ui.print('━━━ 炼·健身（广埠屯店） ━━━', 'system');
      ui.print('  店名：炼·健身（广埠屯店）', '');
      ui.print('  地址：洪山区珞喻路312号', '');
      ui.print('  营业时间：06:00 - 23:00', '');
      ui.print('', '');
      ui.print('  会员信息：', 'important');
      ui.print('  姓名：梁洛邑', '');
      ui.print('  会员卡号：LF20210428001', '');
      ui.print('  入会时间：2024-08-15', '');
      ui.print('  状态：活跃', '');
      state._navContext = 'wechat.mprog.1';
      return true;
    }
    if (next === 'wechat.mprog.2') {
      var ws2 = game.getState();
      ui.print('━━━ 教练团队 ━━━', 'system');
      ui.print('  C-001  叶斌          力量训练 / 体能提升 / 增肌减脂', '');
      ui.print('  C-003  邹大雄(大怪兽) 体能训练 / 力量训练 / 直播陪练', '');
      ui.print('  C-005  沈子汛        功能性训练 / 核心力量 / 康复训练', '');
      ui.print('  C-007  崔佛Trevor     拳击 / HIIT / 爆发力训练', '');
      ui.print('  C-009  吴教练         瑜伽 / 普拉提 / 拉伸放松', '');
      ui.print('  C-012  羿天          CrossFit / 综合体能 / 团队训练', '');
      ui.print('  C-015  袁琬琰        女性塑形 / 产后恢复 / 小团课', '');
      ui.print('', '');
      if (!ws2.unlockedEvidence.includes('E-17')) {
        game.unlockEvidence('E-17');
        await ui.printDialogue('数字麻姐', ['原来大怪兽教练的真实姓名叫邹大雄。', '有了姓名和手机号，我们可以查他的信用信息了。'], 'digital-human');
        ui.print("[新证据已解锁：E-17｜" + EVIDENCE['E-17'].name + "]", 'evidence');
        game.unlockSystem("信用查询");
        ui.print('[系统解锁：信用查询]', 'evidence');
        game.save();
      }
      state._navContext = 'wechat.mprog.2';
      return true;
    }
    if (next === 'wechat.mprog.3') {
      ui.print('━━━ 我的课程 ━━━', 'system');
      ui.print('  课程名称：力量训练', '');
      ui.print('  课程编号：LS-2026-0617-1215', '');
      ui.print('  教练：邹大雄（大怪兽）', '');
      ui.print('  时间：2026-06-17 12:15 - 13:30', '');
      ui.print('  地点：广埠屯店', '');
      ui.print('', '');
      await ui.printDialogue('数字麻姐', ['今天中午麻姐约了大怪兽教练的直播课，12:15 开始。'], 'digital-human');
      state._navContext = 'wechat.mprog.3';
      return true;
    }
    if (next === 'wechat.gymadmin.enter') {
      var gs = game.getState();
      if (!gs.gymAdminUnlocked) {
        ui.print('━━━ 炼·健身管理后台 ━━━', 'system');
        ui.print('管理后台账号：', 'hint');
        state._navContext = 'gym_login';
        return true;
      }
      state._navContext = 'wechat.gymadmin';
      showNavMenu();
      return true;
    }
    if (next === 'album.1') {
      state._navContext = '相册';
      handleAlbumSystem("1");
      return true;
    }
    if (next === 'album.2') {
      state._navContext = '相册';
      handleAlbumSystem("2");
      return true;
    }
    if (ctx === '相册' && !next) {
      var label = target.label;
      if (label.indexOf('端午礼盒') >= 0) {
        state._navContext = '相册';
        ui.print('  端午礼盒.jpg（06-16）', '');
        ui.print('  公司发的端午节礼盒，粽子和咸鸭蛋。', '');
        ui.print('', '');
        ui.print('日常照片，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('工作餐') >= 0) {
        state._navContext = '相册';
        ui.print('  工作餐.jpg（06-16）', '');
        ui.print('  公司食堂的午餐照片。', '');
        ui.print('', '');
        ui.print('日常照片，无异常。', 'hint');
        return true;
      }
      if (label.indexOf('瑜伽垫') >= 0 || label.indexOf('猫咪') >= 0 || label.indexOf('早餐') >= 0 || label.indexOf('跑步鞋') >= 0 || label.indexOf('咖啡') >= 0 || label.indexOf('吉他') >= 0) {
        state._navContext = '相册';
        ui.print('  ' + label, '');
        ui.print('  日常生活照片，无异常。', 'hint');
        return true;
      }
      return false;
    }
    if (next === 'gym.1') {
      state._navContext = '健身房';
      showGymBasicInfo();
      return true;
    }
    if (next === 'gymadmin.1') {
      state._navContext = 'gymadmin.1';
      handleGymSystem("2");
      return true;
    }
    if (next === 'gymadmin.2') {
      state._navContext = 'gymadmin.2';
      handleGymSystem("3");
      return true;
    }
    if (next === 'gymadmin.3') {
      state._navContext = 'gymadmin.3';
      handleGymSystem("4");
      return true;
    }
    if (next === 'gymadmin.4') {
      state._navContext = 'gymadmin.4';
      handleGymSystem("5");
      return true;
    }
    if (next === 'gym.2') {
      state._navContext = '健身房';
      await showGymCoachTeam();
      return true;
    }
    if (next === 'gym.3') {
      state._navContext = '健身房';
      showGymCourseInfo();
      return true;
    }
    if (next === 'credit.1') {
      handleCreditSystem("1");
      state._navContext = '信用查询';
      return true;
    }
    if (next === 'credit.2') {
      handleCreditSystem("2");
      state._navContext = '信用查询';
      return true;
    }
    if (next === 'credit.3') {
      handleCreditSystem("3");
      state._navContext = '信用查询';
      return true;
    }
    if (next) { state._navContext = next; showNavMenu(); return true; }
    return false;
  }

  function handleNameInput(raw) {
    var state = game.getState();
    var ctx = state._navContext || null;
    var target = resolveNavByName(ctx, raw);
    if (!target) return false;
    return doNavigate(ctx, target);
  }

  function getNumFromInput(input) {
    var m = input.match(/^(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
  }

  function doEnterSystem(key) {
    var state = game.getState();
    if (state.unlockedSystems.indexOf(key) < 0) {
      ui.print("系统暂未解锁。输入 access 查看已解锁系统列表。", "error");
      return false;
    }
    state._navContext = key;

    // 小红书 and 手机定位 are single-page systems that display content directly
    var singlePageSystems = ['小红书', '手机定位'];
    var isSinglePage = singlePageSystems.indexOf(key) >= 0;

    if (typeof ui !== 'undefined' && ui.showConnectionAnimation) {
      var labels = {'OA':'OA 系统','门禁':'门禁系统','停车场':'停车场系统','微信':'微信','健身房':'健身房','信用查询':'信用查询','短信':'短信','相册':'相册','公共监控系统':'公共监控系统','小红书':'小红书','手机定位':'手机定位'};
      var name = labels[key] || key;
      ui.showConnectionAnimation(name, 1500).then(function() {
        if (isSinglePage) {
          handleAccessSystem(key);
        } else {
          showNavMenu();
        }
      });
    } else {
      if (isSinglePage) {
        handleAccessSystem(key);
      } else {
        showNavMenu();
      }
    }
    return true;
  }

  // 处理微信小程序搜索 (首次访问)
async function handleWechatMiniSearchWithAuth(raw) {
  var state = game.getState();
  if (raw.indexOf('炼健身') >= 0) {
    ui.print('[正在打开微信小程序...]', 'hint');
    ui.print('[检测到微信授权请求：炼·健身]', 'hint');
    ui.print('[小程序请求获取以下权限：]', 'hint');
    ui.print('  · 微信昵称：芝麻', '');
    ui.print('  · 微信头像', '');
    ui.print('  · 会员卡信息', '');
    state._waitingForMiniProgramSearch = false;
    state._navContext = 'wechat.mprog.auth';
    var choice = await ui.displayChoice([
      { label: '确认授权', value: 'authorize' },
      { label: '取消', value: 'cancel' },
    ], '是否允许"炼·健身"使用以上信息？');
    if (choice === 'authorize') {
      ui.print('[授权成功]', 'hint');
      state.miniProgramAuthed = true;
      state._navContext = 'wechat.mprog';
      showNavMenu();
    } else {
      ui.print('你取消了授权。', 'hint');
      state._navContext = '微信';
      showNavMenu();
    }
    return true;
  }
  ui.print("未找到该小程序。", "error");
  return true;
}

async function handleWechatMiniSearch(raw) {
    var state = game.getState();
    if (raw.indexOf('炼健身') >= 0) {
      ui.print('[正在打开微信小程序...]', 'hint');
      ui.print('[检测到微信授权请求：炼·健身]', 'hint');
      ui.print('[小程序请求获取以下权限：]', 'hint');
      ui.print('  · 微信昵称：芝麻', '');
      ui.print('  · 微信头像', '');
      ui.print('  · 会员卡信息', '');
      ui.print('', '');

      var choice = await ui.displayChoice([
        { label: '确认授权', value: 'authorize' },
        { label: '取消', value: 'cancel' },
      ], '是否允许"炼·健身"使用以上信息？');

      if (choice === 'authorize') {
        ui.print('[正在以微信昵称"芝麻"的微信身份登录...]', 'important');
        ui.print('[授权成功，已进入小程序]', 'hint');
        state._navContext = 'wechat.mini';
        showNavMenu();
      } else {
        ui.print('你取消了授权。', 'hint');
        state._navContext = 'wechat';
        showNavMenu();
      }
      return true;
    }
    ui.print("未找到该小程序。", "error");
    return true;
  }

  async function handleWechatMiniProgAuth(raw) {
    var state = game.getState();
    ui.print('[正在以"芝麻"身份连接炼·健身小程序...]', 'important');
    var choice = await ui.displayChoice([
      { label: '确认授权', value: 'authorize' },
      { label: '取消', value: 'cancel' },
    ], '是否允许"炼·健身"使用以上信息？');
    if (choice === 'authorize') {
      ui.print('[授权成功]', 'hint');
      state.miniProgramAuthed = true;
      state._navContext = 'wechat.mprog';
      showNavMenu();
    } else {
      ui.print('你取消了授权。', 'hint');
      state._navContext = '微信';
      showNavMenu();
    }
    game.save();
  }

  function dispatch(input) {
    var state = game.getState();
    if (state._waitingForZhengqiao) {
      handleZhengqiaoResponse(input);
      return;
    }
    if (state._parkingLicenseQuery) {
      handleParkingLicenseQuery(input);
      return;
    }
    if (state._monitorSearch) {
      handleMonitorSearch(input);
      return;
    }
    if (state._waitingForMiniProgramSearch) {
      var parsed0 = parseInput(input);
      var cmd0 = parsed0 ? parsed0.cmd : '';
      if (commands[cmd0] || commands[input] || input === 'back' || input === 'help' || input === 'access' || input === 'list' || input === 'cls' || /^\d+$/.test(input)) {
      } else {
        handleWechatMiniSearchWithAuth(input);
        return;
      }
    }
    if (state._navContext === 'wechat_mini_program') {
      var parsed1 = parseInput(input);
      var cmd1 = parsed1 ? parsed1.cmd : '';
      if (commands[cmd1] || commands[input] || input === 'back' || input === 'help' || input === 'access' || input === 'list' || input === 'cls' || /^\d+$/.test(input)) {
      } else {
        handleWechatMiniSearch(input);
        return;
      }
    }
    if (state._navContext === 'wechat.apps') {
      var parsed2 = parseInput(input);
      var cmd2 = parsed2 ? parsed2.cmd : '';
      if (commands[cmd2] || commands[input] || input === 'back' || input === 'help' || input === 'access' || input === 'list' || input === 'cls' || /^\d+$/.test(input)) {
      } else {
        handleWechatMiniSearchWithAuth(input);
        return;
      }
    }
    if (state._navContext === 'wechat.mprog.auth') {
      var parsed3 = parseInput(input);
      var cmd3 = parsed3 ? parsed3.cmd : '';
      if (commands[cmd3] || commands[input] || input === 'back' || input === 'help' || input === 'access' || input === 'list' || input === 'cls' || /^\d+$/.test(input)) {
      } else {
        handleWechatMiniProgAuth(input);
        return;
      }
    }
    if (state._creditQuery) {
      handleCreditQuery(input);
      state._creditQuery = false;
      return;
    }
    if (state._navContext === 'gym_login') {
      state._gymAccount = input;
      ui.print('管理后台密码：', 'hint');
      state._navContext = 'gym_login_pwd';
      return;
    }
    if (state._navContext === 'gym_login_pwd') {
      if (state._gymAccount === 'zoudaxiong' && input === '7753') {
        ui.print('[正在连接炼·健身管理后台...]', 'hint');
        ui.print('[账号验证中...]','[密码验证中...]', 'hint');
        ui.print('[登录成功]', 'hint');
        state.gymAdminUnlocked = true;
        game.unlockSystem("信用查询");
        ui.print('[管理后台已解锁]', 'evidence');
        game.save();
        state._navContext = 'wechat.gymadmin';
        showNavMenu();
      } else {
        ui.print("账号或密码错误。", "error");
        state._navContext = 'gym_login';
        ui.print('管理后台账号：', 'hint');
      }
      return;
    }
    var parsed = parseInput(input);
    if (parsed) {
      state.totalCommands++;
      var def = commands[parsed.cmd];
      if (def) {
        if (def.unlockedWhen && !def.unlockedWhen(state)) {
          ui.print("该命令暂未解锁。", "error");
          return;
        }
        if (def.requiresArgs && parsed.args.length === 0) {
          ui.print("命令 "+parsed.cmd+" 需要参数。用法："+(def.usage||parsed.cmd), "error");
          return;
        }
        def.fn(parsed.args, parsed.raw);
        return;
      }
      var num = getNumFromInput(parsed.raw);
      if (num !== null && handleNumberInput(num, parsed.raw)) return;
      if (handleNameInput(parsed.raw)) return;
    }
    ui.print("输入其他内容我会尝试理解你的意思。", "hint");
  }

  return {
    register: register,
    parseInput: parseInput,
    dispatch: dispatch,
    enterSystem: doEnterSystem,
    showNavMenu: showNavMenu,
  };
})();
async function showOAChatChenli() {
  ui.print('━━━ OA 聊天记录 — 陈立 ━━━', 'system');
  ui.print('【梁洛邑 ↔ 陈立（产品研发部·产品总监）】', 'important');
  ui.print('共 8 条消息  ｜  2026-06-08 至 2026-06-16', '');
  ui.print('', '');
  ui.print('─── 06-16 ───', 'hint');
  ui.print('  16:30 陈立: @梁洛邑 周三评审的材料你这边准备得怎么样了？', '');
  ui.print('  16:35 梁洛邑: 差不多了，PRD 终版和原型图都更新过了，明早发你邮箱。', '');
  ui.print('  16:36 陈立: 好，赵总那边会重点看支付流程，你多准备一下。', '');
  ui.print('  16:40 梁洛邑: 收到。支付流程那一块我加了流程图和异常情况说明，应该够用。', '');
  ui.print('', '');
  ui.print('─── 06-15 ───', 'hint');
  ui.print('  14:00 陈立: 【群发】周三下午 3 点 B302 会议室，赵总主持端午前上线方案评审。', '');
  ui.print('  14:05 梁洛邑: 收到，按时到。', '');
  ui.print('', '');
  ui.print('─── 06-13 ───', 'hint');
  ui.print('  17:40 陈立: 本周周报你先发我看看，下周一要报给赵总。', '');
  ui.print('  17:45 梁洛邑: 已经写好了，附件发你。', '');
  ui.print('  17:46 陈立: 收到，我看一眼。', '');
  ui.print('', '');
  ui.print('─── 06-10 ───', 'hint');
  ui.print('  10:30 陈立: 今天下午的需求评审会议你来主持，我陪赵总开会。', '');
  ui.print('  10:32 梁洛邑: 没问题，我把会议纪要整理好同步给你。', '');
  ui.print('', '');
  ui.print('─── 06-08 ───', 'hint');
  ui.print('  14:15 陈立: 端午上线方案改了几版了？', '');
  ui.print('  14:20 梁洛邑: 三版了。技术那边反馈的几个点我都已经调整。', '');
  ui.print('  14:22 陈立: 好的，辛苦。', '');
  ui.print('', '');
  await ui.printDialogue('数字麻姐', ['陈立是产品研发部的产品总监。聊天都是正常的工作沟通——产品评审、周报、需求变更。没有任何私人话题。'], 'digital-human');
}

async function showOAChatQianmin() {
  ui.print('━━━ OA 聊天记录 — 钱敏 ━━━', 'system');
  ui.print('【梁洛邑 ↔ 钱敏（行政部）】', 'important');
  ui.print('共 5 条消息  ｜  2026-06-07 至 2026-06-16', '');
  ui.print('', '');
  ui.print('─── 06-16 ───', 'hint');
  ui.print('  16:25 钱敏: 端午节值班表已经发到 OA 流程里了，麻烦你看一下。', '');
  ui.print('  16:30 钱敏: 另外 6 月 19 日到 21 日公司放假，17 日正常上班。', '');
  ui.print('  16:32 梁洛邑: 收到，已经看过了。', '');
  ui.print('', '');
  ui.print('─── 06-15 ───', 'hint');
  ui.print('  16:45 钱敏: 梁洛邑你好，你的门禁卡申请已经转到行政部了，预计 6 月 17 日之前会审批完成。', '');
  ui.print('  16:50 梁洛邑: 好的，谢谢！', '');
  ui.print('', '');
  ui.print('─── 06-14 ───', 'hint');
  ui.print('  09:00 钱敏: 提醒一下，6 月 17 日开始工位区域门禁升级为刷卡+人脸识别，6 月 16 日下班前请所有员工完成人脸采集。', '');
  ui.print('  09:05 梁洛邑: 好的，今天下班前完成采集。', '');
  ui.print('', '');
  ui.print('─── 06-07 ───', 'hint');
  ui.print('  14:30 钱敏: 端午节公司福利品已到，麻烦你下班前到前台领取。', '');
  ui.print('  14:35 梁洛邑: 收到，谢谢！', '');
  ui.print('', '');
  await ui.printDialogue('数字麻姐', ['钱敏是行政部专员。聊天都是关于门禁卡、端午节值班、福利发放等行政事务。完全是正常的工作沟通。'], 'digital-human');
}

async function showOAChatZhaolei() {
  ui.print('━━━ OA 聊天记录 — 赵磊 ━━━', 'system');
  ui.print('【梁洛邑 ↔ 赵磊（技术部·后端工程师）】', 'important');
  ui.print('共 3 条消息  ｜  2026-06-02 至 2026-06-10', '');
  ui.print('', '');
  ui.print('─── 06-10 ───', 'hint');
  ui.print('  14:10 赵磊: 订单模块的接口文档我更新了，麻烦你确认一下。', '');
  ui.print('  14:15 梁洛邑: 收到，我看一下，有问题再找你。', '');
  ui.print('', '');
  ui.print('─── 06-04 ───', 'hint');
  ui.print('  11:30 赵磊: 端午节上线的优惠券逻辑我提了一个 PR，你看下是否符合预期。', '');
  ui.print('  11:35 梁洛邑: 好的，下午 review 完反馈给你。', '');
  ui.print('', '');
  ui.print('─── 06-02 ───', 'hint');
  ui.print('  16:00 赵磊: 下次需求评审能不能提前一天发我 PRD？我好做技术预研。', '');
  ui.print('  16:05 梁洛邑: 可以，下次我提前两天发。', '');
  ui.print('', '');
  await ui.printDialogue('数字麻姐', ['赵磊是技术部后端工程师。聊天都是技术接口、PR review、需求文档相关的纯工作内容。'], 'digital-human');
}

async function showOAChatSunyi() {
  ui.print('━━━ OA 聊天记录 — 孙艺 ━━━', 'system');
  ui.print('【梁洛邑 ↔ 孙艺（产品设计部·UI 设计师）】', 'important');
  ui.print('共 2 条消息  ｜  2026-06-05 至 2026-06-07', '');
  ui.print('', '');
  ui.print('─── 06-07 ───', 'hint');
  ui.print('  10:35 梁洛邑: 端午节活动页的设计稿能周三前给到吗？评审需要。', '');
  ui.print('  10:40 孙艺: 可以，周四下班前发你。', '');
  ui.print('', '');
  ui.print('─── 06-05 ───', 'hint');
  ui.print('  15:20 孙艺: 上次讨论的会员中心改版方案，第三版我做好了，链接发你。', '');
  ui.print('  15:25 梁洛邑: 收到，我看一眼。', '');
  ui.print('', '');
  await ui.printDialogue('数字麻姐', ['孙艺是设计部 UI。聊天就是设计稿交付相关，很简短。'], 'digital-human');
}

function showGymBasicInfo() {
  ui.print('━━━ 炼·健身（广埠屯店） ━━━', 'system');
  ui.print('  店名：炼·健身（广埠屯店）', '');
  ui.print('  地址：洪山区珞喻路 312 号', '');
  ui.print('  营业时间：06:00 - 23:00', '');
  ui.print('  前台电话：027-8765-4321', '');
  ui.print('', '');
  ui.print('  会员信息：', 'important');
  ui.print('  姓名：梁洛邑', '');
  ui.print('  会员卡号：LF2024051501', '');
  ui.print('  会员类型：年卡会员', '');
  ui.print('  到期日：2026-05-15（已过期）', '');
  ui.print('  续费状态：未续费', '');
  ui.print('', '');
  ui.print('健身房基本信息，无异常。', 'hint');
}

async function showGymCoachTeam() {
  var state = game.getState();
  ui.print('━━━ 炼健身·教练团队 ━━━', 'system');
  ui.print('  C-001  叶斌          力量训练 / 体能提升 / 增肌减脂', '');
  ui.print('  C-003  邹大雄(大怪兽) 体能训练 / 力量训练 / 直播陪练', '');
  ui.print('  C-005  沈子汛        功能性训练 / 核心力量 / 康复训练', '');
  ui.print('  C-007  崔佛Trevor    拳击 / HIIT / 爆发力训练', '');
  ui.print('  C-009  吴教练        瑜伽 / 普拉提 / 拉伸放松', '');
  ui.print('  C-012  羿天          CrossFit / 综合体能 / 团队训练', '');
  ui.print('  C-015  袁琬琰        女性塑形 / 产后恢复 / 小团课', '');
  ui.print('', '');
  if (!state.unlockedEvidence.includes('E-17')) {
    game.unlockEvidence('E-17');
    await ui.printDialogue('数字麻姐', ['原来大怪兽教练的真实姓名叫邹大雄。', '有了姓名和手机号，我们可以查他的信用信息了。'], 'digital-human');
    ui.print("[新证据已解锁：E-17｜" + EVIDENCE['E-17'].name + "]", 'evidence');
    game.unlockSystem('信用查询');
    ui.print('[系统解锁：信用查询]', 'evidence');
    game.save();
  }
}

function showGymCourseInfo() {
  ui.print('━━━ 炼健身·我的课程 ━━━', 'system');
  ui.print('  课程：力量训练直播课', '');
  ui.print('  教练：邹大雄（大怪兽）', '');
  ui.print('  时间：2026-06-17 12:05 - 13:30', '');
  ui.print('  地点：健身房 B 区直播间', '');
  ui.print('  状态：进行中', '');
  ui.print('', '');
  ui.print('课程信息，无异常。', 'hint');
}

function showOAContacts() {
  ui.print('━━━ OA - 通讯录 ━━━', 'system');
  ui.print('  姓名：梁洛邑  工号：CM-2021-0047', '');
  ui.print('  部门：产品研发部  职位：高级产品经理', '');
  ui.print('  手机：138****8812', '');
  ui.print('  企业微信：liangly', '');
  ui.print('', '');
  ui.print('[常用联系人]', 'important');
  ui.print('  郑桥（高级研发工程师）134****7821', '');
  ui.print('  陈立（产品总监）136****2903', '');
  ui.print('  钱敏（行政部）', '');
  ui.print('  赵磊（后端工程师）', '');
  ui.print('  孙艺（UI 设计师）', '');
  ui.print('', '');
  ui.print('选择 2 查看聊天记录，3 查看邮箱，4 查看流程。', 'hint');
}

async function showOAChatZhengqiao() {
  var state = game.getState();
  async function printZhengqiaoMessages() {
    ui.print('━━━ OA 聊天记录 — 郑桥 ━━━', 'system');
    ui.print('【梁洛邑 ↔ 郑桥（技术部）】', 'important');
    var e02 = EVIDENCE['E-02'].content;
    ui.print('共 ' + e02.messages.length + ' 条消息  ｜  ' + e02.dateRange, '');
    ui.print('', '');
    var messages = e02.messages;
    var lastDate = '';
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      var date = msg.date.split(' ')[0];
      if (date !== lastDate) {
        if (lastDate) ui.print('', '');
        ui.print('─── ' + date + ' ───', 'hint');
        lastDate = date;
      }
      ui.print('  ' + msg.date.split(' ')[1] + ' ' + msg.from + ': ' + msg.text, '');
    }
    ui.print('', '');
    await ui.printDialogue('数字麻姐', [e02.analysis], 'digital-human');
    ui.print('', '');
    ui.print('输入 list 查看完整证据，或 combine 组合证据。', 'hint');
  }
  if (state.unlockedEvidence.includes('E-02')) {
    ui.print('[已解锁] OA 聊天记录 — 郑桥', 'important');
    printZhengqiaoMessages();
  } else {
    game.unlockEvidence('E-02');
    await ui.printDialogue('数字麻姐', ['看看郑桥的聊天记录...','这个人最近和麻姐私聊明显变多了。'], 'digital-human');
    ui.print("[新证据已解锁：E-02｜" + EVIDENCE["E-02"].name + "]", "evidence");
    printZhengqiaoMessages();
    game.save();
  }
}

async function showOAWorkflow1() {
  var state = game.getState();
  ui.print('━━━ OA - 流程详情 ━━━', 'system');
  ui.print('  流程编号：AP-2026-2045', '');
  ui.print('  申请人：梁洛邑（CM-2021-0047）', '');
  ui.print('  申请类型：门禁权限激活', '');
  ui.print('  申请时间：2026-06-15 09:15', '');
  ui.print('  审批状态：已通过（行政部·钱敏）', '');
  ui.print('  审批时间：2026-06-17 08:00', '');
  ui.print('', '');
  ui.print('  申请说明：刷卡时提示"权限验证失败"，无法进入工位区域。', '');
  ui.print('', '');
  ui.print('  [激活链接] 请确认激活门禁权限', 'important');
  ui.print('', '');

  if (!state.unlockedEvidence.includes('E-03')) {
    await ui.printDialogue('数字麻姐', [
      '门禁权限激活流程...门禁卡失效了？',
      '这个激活链接可以恢复门禁权限。',
      '你要帮我点击激活吗？',
    ], 'digital-human');
    
    var choice = await ui.displayChoice([
      { label: '确认激活门禁权限', value: 'activate' },
      { label: '取消', value: 'cancel' },
    ], '门禁权限激活确认：');

    if (choice === 'activate') {
      state.doorActivated = true;
      game.unlockEvidence('E-03');
      game.unlockSystem('门禁');
      game.unlockSystem('停车场');
      await ui.printDialogue('数字麻姐', [
        '门禁和停车场系统已解锁。',
        '另外，手机是锁屏状态，试试 unlock 解锁手机。',
      ], 'digital-human');
      ui.print('[新证据已解锁：E-03｜' + EVIDENCE['E-03'].name + ']', 'evidence');
      ui.print('[系统解锁：门禁 / 停车场]', 'evidence');
      ui.print('[企业邮箱通知：门禁激活成功]', 'evidence');
      game.save();
    } else {
      ui.print('你取消了激活。', 'hint');
    }
  }
}

async function showOAEmailByIndex(index) {
  var state = game.getState();
  var e03 = EVIDENCE['E-03'].content;
  if (!e03 || !e03.mails || !e03.mails[index]) {
    ui.print('该邮件不存在。', 'error');
    return;
  }
  var m = e03.mails[index];
  ui.print('━━━ 邮件详情 ━━━', 'system');
  ui.print('  [' + m.id + '] ' + m.subject, 'important');
  ui.print('  发件：' + m.from, '');
  ui.print('  收件：' + (m.to || ''), '');
  ui.print('  时间：' + m.time, '');
  ui.print('', '');
  ui.print(m.body, '');
  ui.print('', '');
  if (e03.analysis && m.id === 'M-2026-2098') {
    await ui.printDialogue('数字麻姐', [e03.analysis], 'digital-human');
  }
  ui.print('输入 list 查看完整证据。', 'hint');
}

async function handleCreditQuery(raw) {
  var state = game.getState();
  if (raw.indexOf('邹大雄') >= 0 || raw.indexOf('138') >= 0) {
    if (!state.unlockedEvidence.includes('E-09')) {
      game.unlockEvidence('E-09');
      await ui.printDialogue('数字麻姐', ['教练信用记录非常糟糕。','负债约 47 万元，有赌博和催收。'], 'digital-human');
      ui.print("[新证据已解锁：E-09|"+EVIDENCE["E-09"].name+"]", "evidence");
    }
    ui.print('[已解锁] 教练信用：邹大雄，负债约47万', 'hint');
    state._navContext = null;
    game.save();
    return true;
  }
  if (raw.indexOf('郑桥') >= 0 || raw.indexOf('189') >= 0) {
    if (!state.unlockedEvidence.includes('E-10')) {
      game.unlockEvidence('E-10');
      ui.print('郑桥信用记录：信用良好，无逾期。', 'hint');
      ui.print("[新证据已解锁：E-10|"+EVIDENCE["E-10"].name+"]", "evidence");
    }
    state._navContext = null;
    game.save();
    return true;
  }
  if (raw.indexOf('张英河') >= 0 || (raw.indexOf('15') >= 0 && raw.indexOf('+') >= 0)) {
    if (!state.unlockedEvidence.includes('E-11')) {
      game.unlockEvidence('E-11');
      await ui.printDialogue('数字麻姐', ['网友张英河无不良信用记录。'], 'digital-human');
      ui.print("[新证据已解锁：E-11|"+EVIDENCE["E-11"].name+"]", "evidence");
    }
    state._navContext = null;
    game.save();
    return true;
  }
  ui.print("未找到该人员。请输入\"姓名+手机号\"格式。", "error");
  ui.print("  示例：邹大雄 138xxxx7753", "hint");
  return true;
}
// === 命令注册 ===

command.register('help', {
  desc: '显示本菜单',
  fn: function() {
    var state = game.getState();
    ui.print('当前可用操作：', 'hint');
    ui.print('  help       显示本菜单', '');
    ui.print('  access     查看我可以访问的系统列表', '');
    ui.print('  list       查看目前已收集的信息清单', '');
    if (state.unlockedEvidence.length >= 2) {
      ui.print('  combine    组合分析证据（如 combine E-05+E-18）', '');
      ui.print('  conclusions 查看已生成结论', '');
    }
    ui.print('  view       查看证据详情（如 view E-01）', '');
    ui.print('  back       返回上一级', '');
    ui.print('  cls        清屏（不影响存档）', '');
    ui.print('  clear      删除存档（clear confirm）', '');
    ui.print('  save       保存游戏', '');
    ui.print('  load       加载游戏', '');
    if (state.currentStage >= 2 && !state.phoneUnlocked) {
      ui.print('  unlock     解锁手机（输入 unlock + 密码）', '');
    }
    if (state.currentStage >= 4 && state.combineUnlocked.length >= 1) {
      ui.print('  backup     创建数据备份', '');
    }
    if (state.currentStage >= 5) {
      ui.print('  submit     提交证据至警方', '');
    }
    ui.print('', '');
    ui.print('输入其他内容我会尝试理解你的意思。', 'hint');
  },
});

command.register('list', {
  desc: '查看已解锁证据',
  fn: function() {
    var state = game.getState();
    if (state.unlockedEvidence.length === 0) {
      ui.print('你还没有解锁任何证据。', 'hint');
      return;
    }
    state.unlockedEvidence.forEach(function(id) {
      ui.print('  [' + id + '] ' + EVIDENCE[id].name, 'evidence');
    });
  },
});

command.register('access', {
  desc: '查看可访问的系统列表',
  fn: function() {
    var state = game.getState();
    state._navContext = null;
    command.showNavMenu();
  },
});

command.register('combine', {
  desc: '组合分析证据',
  unlockedWhen: function(s) { return s.unlockedEvidence.length >= 2; },
  requiresArgs: true,
  usage: 'combine E-XX+E-YY',
  fn: function(args) { handleCombine(args); },
});

command.register('conclusions', {
  desc: '查看已生成结论',
  fn: function() {
    var state = game.getState();
    if (state.combineUnlocked.length === 0) {
      ui.print('你还没有生成任何结论。使用 combine 组合证据。', 'hint');
      return;
    }
    state.combineUnlocked.forEach(function(cid) {
      var def = COMBINES[cid];
      ui.print('[' + cid + '] ' + def.name, 'important');
      ui.print(def.analysis, '');
      ui.print('', '');
    });
  },
});

command.register('backup', {
  desc: '创建数据备份',
  unlockedWhen: function(s) { return s.currentStage >= 4 && s.combineUnlocked.length >= 1; },
  fn: async function() {
    var state = game.getState();
    if (state.backupCreated) { ui.print('备份已存在。', 'hint'); return; }
    ui.print('[备份中...]', 'hint');
    setTimeout(async function() {
      state.backupCreated = true;
      ui.print('', '');
      await ui.printDialogue('数字麻姐', [
        '已将所有证据数据备份到本地。',
        '如果有人试图删除云端数据，我们的备份还在。',
      ], 'digital-human');
      ui.print('', '');
      ui.print('  本地文件已保存', '');
      ui.print('  路径：/storage/backup_20260617.dat', '');
      ui.print('  共保存了 ' + state.unlockedEvidence.length + ' 条信息。', '');
      ui.print('', '');
      ui.print('[数据备份已创建]', 'evidence');
      game.save();
    }, 1000);
  },
});

command.register('submit', {
  desc: '提交证据至警方',
  unlockedWhen: function(s) { return s.currentStage >= 5; },
  fn: async function() {
    var state = game.getState();
    if (state.combineUnlocked.length < 4) { ui.print('需要 4 个结论才能提交。', 'error'); return; }
    if (state.backupCreated) {
      state.endingReached = 'ending2';
      showEnding('ending2');
    } else {
      await ui.printDialogue('数字麻姐', ['请先创建备份再提交。'], 'digital-human');
    }
  },
});

command.register('unlock', {
  desc: '解锁手机',
  unlockedWhen: function(s) { return s.currentStage >= 2 && !s.phoneUnlocked; },
  fn: function() {
    var state = game.getState();
    state._navContext = 'phone_unlock';
    ui.print('手机解锁', 'system');
    ui.print('请输入 4 位数字密码：', 'hint');
    ui.print('她习惯用简单好记的数字。', 'hint');
  },
});

command.register('view', {
  desc: '查看证据详情',
  requiresArgs: true,
  usage: 'view E-XX',
  fn: function(args) {
    var id = args[0].toUpperCase();
    if (!id.match(/^E-\d{2}$/)) { ui.print('格式错误：view E-XX', 'error'); return; }
    var state = game.getState();
    if (!state.unlockedEvidence.includes(id)) { ui.print('证据 ' + id + ' 未解锁。', 'error'); return; }
    handleViewEvidence(id);
  },
});

command.register('cls', {
  desc: '清屏',
  fn: function() {
    if (typeof ui.clear === 'function') ui.clear();
  },
});

command.register('clear', {
  desc: '清除存档',
  requiresArgs: true,
  usage: 'clear confirm',
  fn: function(args) {
    if (args.length > 0 && args[0] === 'confirm') { clearSave(); }
    else { ui.print('用法：clear confirm', 'error'); }
  },
});

command.register('save', {
  desc: '保存游戏',
  fn: function() { saveGame(); },
});

command.register('load', {
  desc: '加载游戏',
  fn: function() {
    if (!hasSaveCheck()) { ui.print('没有可用的存档', 'warning'); return; }
    loadGame();
  },
});

command.register('back', {
  desc: '返回上一级',
  fn: function() {
    var state = game.getState();
    var ctx = state._navContext || null;
    if (!ctx) { ui.print('已在最顶层。', 'hint'); return; }
    var parent = null;
    if (ctx === 'OA.contacts'||ctx==='OA.chat'||ctx==='OA.email'||ctx==='OA.workflow') parent = 'OA';
    else if (ctx==='door.1'||ctx==='door.2') parent = '门禁';
    else if (ctx.startsWith('parking.')) parent = '停车场';
    else if (ctx.startsWith('sms.')) parent = '短信';
    else if (ctx==='wechat.chat'||ctx==='wechat.pay') parent = '微信';
    else if (ctx==='wechat.apps') parent = '微信';
    else if (ctx==='wechat.mprog'||ctx==='wechat.gymadmin') parent = 'wechat.apps';
    else if (ctx==='wechat.chat.dashou'||ctx==='wechat.chat.laogong') parent = 'wechat.chat';
    else if (ctx.startsWith('wechat.mprog.')) parent = 'wechat.mprog';
    else if (ctx.startsWith('wechat.gymadmin.')||ctx.startsWith('gymadmin.')) parent = 'wechat.gymadmin';
    else if (ctx==='gym_login'||ctx==='gym_login_pwd') parent = '微信';
    else if (ctx==='相册'||ctx==='健身房'||ctx==='信用查询'||ctx==='门禁'||ctx==='停车场'||ctx==='短信'||ctx==='微信'||ctx.startsWith('album.')||ctx.startsWith('gym.')||ctx.startsWith('credit.')||ctx.startsWith('door.')||ctx.startsWith('parking.')||ctx.startsWith('sms.')||ctx.startsWith('wechat.')) parent = null;
    else {
      var parts = ctx.split('.');
      if (parts.length > 1) parent = parts.slice(0, -1).join('.');
    }
    if (!parent) {
      state._navContext = null;
      command.showNavMenu();
      return;
    }
    state._navContext = parent;
    command.showNavMenu();
  },
});