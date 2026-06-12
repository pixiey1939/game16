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
      if (state.doorActivated) {
        items.push({ num: 1, label: 'M-2098 门禁权限激活申请', desc: '系统通知', next: 'OA.email.1' });
      }
      items.push({ num: 2, label: 'M-2085 端午节假期安排', desc: '钱敏', next: 'OA.email.2' });
      items.push({ num: 3, label: 'M-2072 项目评审', desc: '陈立', next: 'OA.email.3' });
      items.push({ num: 4, label: 'M-2055 门禁权限变更提醒', desc: '系统通知', next: 'OA.email.4' });
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
      return [
        { num: 1, label: '广埠屯惠选超市' },
        { num: 2, label: '广捷洗车（广埠屯店）' },
      ];
    }
    if (ctx === '短信') {
      return [
        { num: 1, label: '15xxxxxxxxx（Embrace）', desc: '06-17 13:33', next: 'sms.1' },
      ];
    }
    if (ctx === '微信') {
      return [
        { num: 1, label: '聊天记录', desc: '对话列表', next: 'wechat.chat' },
        { num: 2, label: '微信小程序', next: 'wechat.mini' },
        { num: 3, label: '朋友圈' },
      ];
    }
    if (ctx === 'wechat.chat') {
      return [
        { num: 1, label: '大怪兽', desc: '06-17 12:00', next: 'wechat.chat.dashou' },
        { num: 2, label: '产品研发部工作群', desc: '06-16 16:35' },
        { num: 3, label: '老公', desc: '05-25', next: 'wechat.chat.laogong' },
        { num: 4, label: '姐妹群', desc: '06-13' },
        { num: 5, label: '妈妈', desc: '06-10' },
        { num: 6, label: '普拉提佩佩', desc: '06-17 10:20' },
        { num: 7, label: '微信支付', desc: '06-17 11:43', next: 'wechat.pay' },
        { num: 8, label: '文件传输助手', desc: '06-16 14:20' },
        { num: 9, label: '老板', desc: '06-16 18:45' },
        { num: 10, label: '57', desc: '06-13 22:15' },
      ];
    }
    if (ctx === 'wechat.mini') {
      return [
        { num: 1, label: '基本信息', next: 'wechat.mini.1' },
        { num: 2, label: '教练团队', next: 'wechat.mini.2' },
        { num: 3, label: '我的课程', next: 'wechat.mini.3' },
      ];
    }
    if (ctx === '相册') {
      return [
        { num: 1, label: '借条照片', next: 'album.1' },
        { num: 2, label: 'WiFi 视频', next: 'album.2' },
      ];
    }
    if (ctx === '健身房') {
      return [
        { num: 1, label: '教练信息', next: 'gym.1' },
        { num: 2, label: '门禁记录', next: 'gym.2' },
        { num: 3, label: '监控截图', next: 'gym.3' },
        { num: 4, label: 'Wi-Fi 日志', next: 'gym.4' },
      ];
    }
    if (ctx === '信用查询') {
      return [
        { num: 1, label: '教练信用（邹大雄）', next: 'credit.1' },
        { num: 2, label: '郑桥信用', next: 'credit.2' },
        { num: 3, label: '网友信用（张英河）', next: 'credit.3' },
      ];
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
    var items = getNavItems(ctx);
    if (!items) return;
    if (!ctx) {
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
    var labels = {'OA':'OA 系统','门禁':'门禁系统','停车场':'停车场系统','微信':'微信','健身房':'健身房','信用查询':'信用查询','短信':'短信','相册':'相册','公共监控系统':'公共监控系统','小红书':'小红书','手机定位':'手机定位','OA.chat':'OA - 聊天记录','OA.email':'OA - 企业邮箱','OA.contacts':'OA - 通讯录','OA.workflow':'OA - 我的流程','wechat.chat':'微信 - 聊天记录','wechat.mini':'微信小程序'};
    var label = labels[ctx] || ctx;
    ui.print('━━━ ' + label + ' ━━━', 'system');
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
    if (ctx === 'gym_login') {
      state._gymAccount = raw;
      ui.print('管理后台密码：', 'hint');
      state._navContext = 'gym_login_pwd';
      return true;
    }
    if (ctx === 'gym_login_pwd') {
      if (state._gymAccount === 'zoudaxiong' && raw === '7753') {
        ui.print('[正在连接炼·健身管理后台...]', 'hint');
        ui.print('[账号验证中...]','[密码验证中...]', 'hint');
        ui.print('[登录成功]', 'hint');
        state._navContext = null;
        state.gymAdminUnlocked = true;
        game.unlockSystem("信用查询");
        ui.print('[管理后台已解锁]', 'evidence');
        game.save();
      } else {
        ui.print("账号或密码错误。", "error");
        state._navContext = 'gym_login';
        ui.print('管理后台账号：', 'hint');
      }
      return true;
    }
    if (ctx === 'wechat_mini_program') {
      if (raw.indexOf('炼健身') >= 0) {
        ui.print('[正在通过微信授权登录小程序...]', 'hint');
        ui.print('[授权成功]', 'hint');
        state._navContext = 'wechat.mini';
        showNavMenu();
        return true;
      }
      ui.print("未找到该小程序。", "error");
      return true;
    }
    if (ctx === 'credit_query') return handleCreditQuery(raw);
    var target = resolveNavByNumber(ctx, num);
    if (!target) { ui.print("无效编号。", "error"); return false; }
    return doNavigate(ctx, target);
  }

  function doNavigate(ctx, target) {
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
      ui.print('与陈立的聊天记录均为正常工作往来。', 'hint');
      return true;
    }
    if (next === 'OA.chat.qianmin') {
      ui.print('与钱敏的聊天记录均为行政事务。', 'hint');
      state._navContext = 'OA.chat';
      return true;
    }
    if (next === 'OA.chat.zhaolei') {
      ui.print('与赵磊的聊天记录均为技术协作。', 'hint');
      state._navContext = 'OA.chat';
      return true;
    }
    if (next === 'OA.chat.sunyi') {
      ui.print('与孙艺的聊天记录均为设计稿交付。', 'hint');
      state._navContext = 'OA.chat';
      return true;
    }
    if (next === 'OA.email.1') {
      state._navContext = next;
      showOAEmail1();
      return true;
    }
    if (next === 'OA.email.2'||next==='OA.email.3'||next==='OA.email.4') {
      state._navContext = next;
      ui.print('该邮件内容为日常工作通知，无异常。', 'hint');
      return true;
    }
    if (next === 'OA.email.2'||next==='OA.email.3'||next==='OA.email.4') {
      state._navContext = next;
      ui.print('该邮件内容为日常工作通知，无异常。', 'hint');
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
      var num = target.num;
      if (num === 1) {
        var state = game.getState();
        if (!state.unlockedEvidence.includes('E-07')) {
          game.unlockEvidence('E-07');
          var e07 = EVIDENCE["E-07"].content;
          ui.print("监控显示：麻姐在超市门口与一名黑衣年轻男性交谈约10分钟，递了一瓶水。", "hint");
          ui.print("[新证据已解锁：E-07|"+EVIDENCE["E-07"].name+"]", "evidence");
          game.save();
        } else {
          var e07 = EVIDENCE["E-07"].content;
          e07.data.forEach(function(line) { ui.print("  "+line, ""); });
        }
        return true;
      }
      if (num === 2) {
        var state = game.getState();
        if (!state.unlockedEvidence.includes('E-08')) {
          game.unlockEvidence('E-08');
          ui.print("监控显示：郑桥在洗车店卫生间待了30分钟，非常反常。", "hint");
          ui.print("[新证据已解锁：E-08|"+EVIDENCE["E-08"].name+"]", "evidence");
          game.save();
        } else {
          var e08 = EVIDENCE["E-08"].content;
          e08.data.forEach(function(line) { ui.print("  "+line, ""); });
        }
        return true;
      }
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
    if (next === 'wechat.mini') {
      state._navContext = next;
      showNavMenu();
      return true;
    }
    if (next === 'wechat.mini.1') {
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
      state._navContext = 'wechat.mini';
      return true;
    }
    if (next === 'wechat.mini.2') {
      var state2 = game.getState();
      ui.print('━━━ 教练团队 ━━━', 'system');
      ui.print('  C-001  叶斌          力量训练 / 体能提升 / 增肌减脂', '');
      ui.print('  C-003  邹大雄(大怪兽) 体能训练 / 力量训练 / 直播陪练', '');
      ui.print('  C-005  沈子汛        功能性训练 / 核心力量 / 康复训练', '');
      ui.print('  C-007  崔佛Trevor     拳击 / HIIT / 爆发力训练', '');
      ui.print('  C-009  吴教练         瑜伽 / 普拉提 / 拉伸放松', '');
      ui.print('  C-012  羿天          CrossFit / 综合体能 / 团队训练', '');
      ui.print('  C-015  袁琬琰        女性塑形 / 产后恢复 / 小团课', '');
      ui.print('', '');
      if (!state2.unlockedEvidence.includes('E-17')) {
        game.unlockEvidence('E-17');
        ui.printDialogue('数字麻姐', ['原来大怪兽教练的真实姓名叫邹大雄。', '有了姓名和手机号，我们可以查他的信用信息了。'], 'digital-human');
        ui.print("[新证据已解锁：E-17｜" + EVIDENCE['E-17'].name + "]", 'evidence');
        game.unlockSystem("信用查询");
        ui.print('[系统解锁：信用查询]', 'evidence');
        game.save();
      }
      ui.printDialogue('数字麻姐', [
        '健身房内部管理数据需要管理后台才能查。',
        '让我试试——通过小程序 API 接口搜索管理后台入口...',
      ], 'digital-human');
      ui.print('[正在通过小程序 API 接口搜索管理后台入口...]', 'system');
      ui.print('[找到后台入口链接]', 'system');
      ui.printDialogue('数字麻姐', [
        '找到了！但需要账号密码才能登录。',
        '刚才看到的教练工号或联系方式，也许能试试？',
      ], 'digital-human');
      ui.print('管理后台账号：', 'hint');
      state._navContext = 'gym_login';
      return true;
    }
    if (next === 'wechat.mini.3') {
      ui.print('━━━ 我的课程 ━━━', 'system');
      ui.print('  课程名称：力量训练', '');
      ui.print('  课程编号：LS-2026-0617-1215', '');
      ui.print('  教练：邹大雄（大怪兽）', '');
      ui.print('  时间：2026-06-17 12:15 - 13:30', '');
      ui.print('  地点：广埠屯店', '');
      ui.print('', '');
      ui.printDialogue('数字麻姐', ['今天中午麻姐约了大怪兽教练的直播课，12:15 开始。'], 'digital-human');
      state._navContext = 'wechat.mini';
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
    if (next === 'gym.1') {
      state._navContext = '健身房';
      handleGymSystem("1");
      return true;
    }
    if (next === 'gym.2') {
      state._navContext = '健身房';
      handleGymSystem("2");
      return true;
    }
    if (next === 'gym.3') {
      state._navContext = '健身房';
      handleGymSystem("3");
      return true;
    }
    if (next === 'gym.4') {
      state._navContext = '健身房';
      handleGymSystem("4");
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
    showNavMenu();
    return true;
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

function showOAChatZhengqiao() {
  var state = game.getState();
  if (state.unlockedEvidence.includes('E-02')) {
    ui.print('[已解锁] OA 聊天记录 — 郑桥', 'important');
    var e02 = EVIDENCE['E-02'].content;
    ui.print('共 24 条私聊（2026-06-11 ~ 2026-06-17）', '');
    ui.print('最新几条（案发当天）：', '');
    ui.print('  09:40 郑桥: 对了，你今天中午有安排吗？', '');
    ui.print('  09:42 郑桥: 这周五端午假期开始了', '');
    ui.print('  09:43 麻姐: 中午有事，端午假期没安排', '');
    ui.print('', '');
    ui.print('输入 list 查看完整证据，或 combine 组合。', 'hint');
  } else {
    game.unlockEvidence('E-02');
    ui.printDialogue('数字麻姐', ['看看郑桥的聊天记录...','这个人最近和麻姐私聊明显变多了。'], 'digital-human');
    ui.print("[新证据已解锁：E-02|"+EVIDENCE["E-02"].name+"]", "evidence");
    ui.print('共 24 条私聊（2026-06-11 ~ 2026-06-17）', '');
    ui.print('  09:40 郑桥: 对了，你今天中午有安排吗？', '');
    ui.print('  09:42 郑桥: 这周五端午假期开始了', '');
    ui.print('  09:43 麻姐: 中午有事，端午假期没安排', '');
    ui.print('', '');
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
    ui.printDialogue('数字麻姐', [
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
      ui.printDialogue('数字麻姐', [
        '门禁和停车场系统已解锁。',
        '另外，手机是锁屏状态，试试 unlock 1222 解锁手机。',
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

function showOAEmail1() {
  var state = game.getState();
  ui.print('[已解锁] 企业邮箱 — M-2098 门禁权限激活', 'important');
  var e03 = EVIDENCE['E-03'].content;
  e03.mails.forEach(function(m) {
    ui.print('  ['+m.id+'] '+m.subject, '');
    ui.print('  发件：'+m.from+'  时间：'+m.time, '');
    ui.print('  正文：'+m.body, '');
    ui.print('', '');
  });
  ui.print('输入 list 查看完整证据。', 'hint');
}

function handleCreditQuery(raw) {
  var state = game.getState();
  if (raw.indexOf('邹大雄') >= 0 || raw.indexOf('138') >= 0) {
    if (!state.unlockedEvidence.includes('E-09')) {
      game.unlockEvidence('E-09');
      ui.printDialogue('数字麻姐', ['教练信用记录非常糟糕。','负债约 47 万元，有赌博和催收。'], 'digital-human');
      ui.print("[新证据已解锁：E-09|"+EVIDENCE["E-09"].name+"]", "evidence");
    }
    ui.print('[已解锁] 教练信用：邹大雄，负债约47万', 'hint');
    state._navContext = 'credit.result';
    game.save();
    return true;
  }
  if (raw.indexOf('张英河') >= 0 || (raw.indexOf('15') >= 0 && raw.indexOf('+') >= 0)) {
    if (!state.unlockedEvidence.includes('E-11')) {
      game.unlockEvidence('E-11');
      ui.print('网友张英河无不良信用记录。', 'hint');
      ui.print("[新证据已解锁：E-11|"+EVIDENCE["E-11"].name+"]", "evidence");
    }
    state._navContext = 'credit.result';
    game.save();
    return true;
  }
  ui.print("请输入格式：姓名+手机号", "error");
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
      ui.print('  unlock     解锁手机（输入 unlock 1222）', '');
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
  fn: function() {
    var state = game.getState();
    if (state.backupCreated) { ui.print('备份已存在。', 'hint'); return; }
    state.backupCreated = true;
    ui.printDialogue('数字麻姐', ['已将所有证据数据备份到本地。','如果有人试图删除云端数据，我们的备份还在。'], 'digital-human');
    ui.print('[数据备份已创建]', 'evidence');
    game.save();
  },
});

command.register('submit', {
  desc: '提交证据至警方',
  unlockedWhen: function(s) { return s.currentStage >= 5; },
  fn: function() {
    var state = game.getState();
    if (state.combineUnlocked.length < 4) { ui.print('需要 4 个结论才能提交。', 'error'); return; }
    if (state.backupCreated) {
      state.endingReached = 'ending2';
      showEnding('ending2');
    } else {
      ui.printDialogue('数字麻姐', ['请先创建备份再提交。'], 'digital-human');
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
    else if (ctx==='wechat.chat'||ctx==='wechat.mini'||ctx==='wechat.pay') parent = '微信';
    else if (ctx==='wechat.chat.dashou'||ctx==='wechat.chat.laogong') parent = 'wechat.chat';
    else if (ctx==='wechat.mini.1'||ctx==='wechat.mini.2'||ctx==='wechat.mini.3') parent = 'wechat.mini';
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