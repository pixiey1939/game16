// GAME 16 — 证据数据
// 21 个证据的完整内容（来源：script/game_design.txt 第四部分 + script/第六部分：游戏流程.md）
// 数据结构：每个证据 = { id, name, type, source, unlockCondition, autoUnlock, content }

const EVIDENCE = {
  'E-01': {
    id: 'E-01',
    name: '手机定位历史',
    type: 'data',
    source: '数字人自带权限',
    autoUnlock: true,  // 阶段 1 自动触发
    content: {
      title: '2026年6月17日麻姐手机定位记录',
      data: [
        '11:35 —— 离开楚门科技（光谷大道）',
        '11:50 —— 到达广埠屯区域',
        '11:50-13:30 —— 停留在广埠屯区域',
        '13:30 —— 定位被手动关闭',
      ],
      analysis: '麻姐 13:30 后失联，定位关闭很反常。',
    },
  },

  'E-02': {
    id: 'E-02',
    name: 'OA聊天记录（与郑桥）',
    type: 'text',
    source: 'OA系统 · 工作聊天模块',
    unlockSystem: 'OA',
    autoUnlock: false,
    content: {
      dateRange: '2026.06.11 - 06.17',
      messages: [
        { date: '06-17 09:40', from: '郑桥', text: '对了，你今天中午有安排吗？' },
        { date: '06-17 09:42', from: '郑桥', text: '这周五开始端午假期开始了，你有什么安排？' },
        { date: '06-17 09:43', from: '梁洛邑', text: '中午有事，端午假期暂时没安排。' },
        { date: '06-16 22:30', from: '郑桥', text: '这周五端午假期开始了，你有什么安排？' },
        { date: '06-16 22:35', from: '郑桥', text: '你一般每天几点到公司？' },
        { date: '06-16 22:40', from: '郑桥', text: '下次来得早可以一起吃个早餐' },
        { date: '06-16 22:45', from: '梁洛邑', text: '没有特别的计划。' },
        { date: '06-15 18:30', from: '郑桥', text: '今天下班早吗？要不要一起吃个饭？' },
        { date: '06-15 18:32', from: '梁洛邑', text: '今天有点累，想早点回去。' },
        { date: '06-15 18:35', from: '郑桥', text: '你做产品经理多久了？' },
        { date: '06-15 18:37', from: '梁洛邑', text: '三年多了。' },
        { date: '06-15 18:40', from: '郑桥', text: '那你之前是做什么的？' },
        { date: '06-15 18:42', from: '梁洛邑', text: '之前在一家创业公司做运营。' },
        { date: '06-14 14:00', from: '郑桥', text: '明天上午10点会议室B302对需求，麻烦确认一下。' },
        { date: '06-14 14:05', from: '梁洛邑', text: '好的，收到。' },
        { date: '06-13 16:45', from: '郑桥', text: '你家住哪里？' },
        { date: '06-13 16:50', from: '郑桥', text: '汉口哪里？我住金银湖' },
        { date: '06-13 16:55', from: '梁洛邑', text: '汉口。' },
        { date: '06-12 12:10', from: '郑桥', text: '中午一起吃饭吗？公司后面新开了湘菜馆' },
        { date: '06-12 12:15', from: '郑桥', text: '对了，你们产品经理平时加班多吗？' },
        { date: '06-12 12:18', from: '梁洛邑', text: '今天约了人，谢谢。' },
        { date: '06-11 14:20', from: '郑桥', text: '端午节值班表发你了，你看下哪天方便？' },
        { date: '06-11 14:25', from: '郑桥', text: '你有孩子了？' },
        { date: '06-11 14:26', from: '郑桥', text: '哦，那挺好的' },
        { date: '06-11 14:30', from: '梁洛邑', text: '嗯，端午节让其他同事排吧。' },
      ],
      analysis: '从 6 月 11 日到 6 月 17 日这一周，郑桥共发了 12 条消息。其中：真正属于工作的只有 1 条（06-14 的 B302 会议室需求对齐）；其他 11 条全部是私人问题：有没有孩子、住哪里、几点下班、加不加班、端午节出不出门。郑桥近一周来频繁打探麻姐的私人生活，边界感明显缺失。',
    },
  },

  'E-09': {
    id: 'E-09',
    name: '教练信用信息',
    type: 'data',
    source: '姓名+手机号查询公开信用数据',
    unlockSystem: '信用查询',
    autoUnlock: false,
    content: {
      name: '邹大雄',
      age: 32,
      debt: {
        total: '约 47 万元',
        items: [
          { type: '网贷逾期', count: 5 },
          { type: '银行消费贷', status: '逾期 3 个月' },
          { type: '民间借贷', amount: '约 15 万' },
        ],
      },
      behavior: '近期有大额转账流向境外账户，疑似网络赌博平台代理',
      collections: '催收记录 3 次（近 30 天）',
      analysis: '教练欠下巨额赌债，有经济动机。',
    },
  },

  'E-10': {
    id: 'E-10',
    name: '郑桥信用记录',
    type: 'data',
    source: '手机号查询公开信用数据',
    unlockSystem: '信用查询',
    autoUnlock: false,
    content: {
      name: '郑桥',
      age: 29,
      occupation: '湖北省楚门科技有限公司·高级研发工程师',
      joinDate: '2020-07',
      creditStatus: '信用卡正常还款，无不良信用记录',
      publicData: '未发现赌博、大额借贷、诉讼等异常经济行为',
      noCrimeRecord: true,
      analysis: '郑桥信用记录正常，无明显经济动机。但不能排除其他动机。',
    },
  },

  'E-11': {
    id: 'E-11',
    name: '网友信用记录',
    type: 'data',
    source: '手机号查询公开信用数据',
    unlockSystem: '信用查询',
    autoUnlock: false,
    content: {
      name: '张英河',
      age: 21,
      occupation: '在校大学生（音乐系）',
      creditStatus: '无不良信用记录',
      noCrimeRecord: true,
      analysis: '网友无犯罪前科，无经济动机。',
    },
  },

  'E-12': {
    id: 'E-12',
    name: '手机短信记录（全量）',
    type: 'text',
    source: '麻姐手机',
    unlockSystem: '短信',
    autoUnlock: false,
    content: {
      embrace: [
        { date: '06-16 20:15', from: 'Embrace', text: '麻姐你好！我是小红书的Embrace，终于鼓起勇气联系你了！\n我是你的粉丝，看了你很多关于吉他的视频，特别喜欢！' },
        { date: '06-16 20:32', from: '麻姐', text: '你好呀！我看过你的吉他视频，弹得超棒！' },
        { date: '06-16 20:35', from: 'Embrace', text: '谢谢麻姐！！我做了个手工电吉他拨片想送给你...\n可以见面给你吗？' },
        { date: '06-16 20:40', from: '麻姐', text: '哇真的吗？好呀，周三中午我在广埠屯附近，方便的话可以见一面。' },
        { date: '06-16 20:42', from: 'Embrace', text: '好的！我到时候带给你！这是我的无犯罪证明，怕你担心...\n[文件：无犯罪证明.pdf]\n对了，我叫张英河……我有点社恐，平时线上聊天多，见面可能有点紧张。' },
        { date: '06-16 20:45', from: '麻姐', text: '哈哈好的，相信你～那周三见！' },
        { date: '06-17 12:00', from: 'Embrace', text: '麻姐，我去吃饭，今天很开心～' },
        { date: '06-17 12:00', from: '麻姐', text: '好的哦，我到健身房了，直播直播。' },
        { date: '06-17 12:00', from: 'Embrace', text: '那我边吃饭边看你直播' },
        { date: '06-17 13:33', from: 'Embrace', text: '麻姐，我已经到健身房门口了，你在哪？' },
        { date: '06-17 13:33', from: '麻姐', text: '我到健身房门口了，你在哪？' },
      ],
      noise: [
        { sender: '1069123456', note: '验证码', date: '06-17 09:42' },
        { sender: '中国移动', note: '话费账单', date: '06-16 18:25' },
        { sender: '钱敏', note: '工作短信', date: '06-16 16:32' },
        { sender: 'OA系统通知', note: '系统通知', date: '06-16 09:00' },
        { sender: '1069876543', note: '银行扣款通知', date: '06-15 17:15' },
        { sender: '招商银行', note: '账单提醒', date: '06-15 12:30' },
        { sender: '中国移动', note: '流量套餐', date: '06-15 08:15' },
        { sender: '顺丰速递', note: '派件提醒', date: '06-14 16:42' },
        { sender: '10086', note: '余额查询', date: '06-13 14:20' },
        { sender: '1069123456', note: '验证码', date: '06-13 10:05' },
        { sender: '中国移动', note: '套餐推荐', date: '06-12 17:20' },
        { sender: '钱敏', note: '工作确认', date: '06-12 09:15' },
        { sender: '10086', note: '月度详单', date: '06-10 19:45' },
        { sender: '1069876543', note: '还款提醒', date: '06-10 09:30' },
        { sender: '工商银行', note: '动账通知', date: '06-07 17:50' },
        { sender: '中国移动', note: '服务提醒', date: '06-06 08:00' },
        { sender: '10086', note: '套餐变更确认', date: '06-04 12:15' },
        { sender: '联通客户', note: '优惠活动', date: '06-02 16:30' },
        { sender: '顺丰速递', note: '取件通知', date: '06-12 14:25' },
        { sender: '中国移动', note: '套餐提醒', date: '06-09 09:50' },
      ],
      analysis: '13:33 这两条消息的发送时间，是在麻姐手机定位被关闭（13:30）之后。而且这两条是同一分钟内互相发的——Embrace 问"你在哪"，麻姐立刻回复"我到健身房门口了，你在哪"。表面上看像是普通对话，但也可能只是手机放在口袋/桌上的快捷回复。要判断是否异常，需要结合其他证据（比如 13:15-13:35 期间 Embrace 设备是否一直在健身房 WiFi 范围内）。',
    },
  },

  'E-13': {
    id: 'E-13',
    name: '手机相册-教练欠钱',
    type: 'image',
    source: '麻姐手机',
    unlockSystem: '相册',
    autoUnlock: false,
    content: {
      title: '借条',
      borrower: '邹大雄',
      lender: '梁洛邑',
      amount: '人民币贰万元整（¥20,000）',
      date: '2026-05-10',
      deadline: '2026-08-31 前归还',
      analysis: '教练向麻姐借了 2 万块钱。',
    },
  },

  'E-14': {
    id: 'E-14',
    name: '手机相册-WiFi 账号密码',
    type: 'image',
    source: '麻姐手机',
    unlockSystem: '相册',
    autoUnlock: false,
    content: {
      title: '健身房环境视频',
      duration: '28 秒',
      description: '麻姐拍摄，镜头扫过墙面时拍到张贴的 WiFi 信息贴纸',
      wifi: { ssid: 'ljs_5G', password: 'justdoit' },
      analysis: '这条 WiFi 信息可用于连接健身房 WiFi 日志后台。',
    },
  },

  // E-03 ~ E-21 占位（详细数据由后续任务填实）
  // 每个证据保持相同结构：id, name, type, source, autoUnlock/unlockSystem, content

  'E-03': {
    id: 'E-03',
    name: 'OA 邮箱记录',
    type: 'text',
    source: 'OA系统 · 公司邮箱模块',
    unlockSystem: 'OA',
    autoUnlock: false,
    content: {
      title: '梁洛邑收件箱中的关键邮件',
      mails: [
        {
          id: 'M-2026-2098',
          subject: '【审批完成】门禁权限激活',
          from: '系统通知 <noreply@chumencloud.com>',
          time: '2026.06.17 08:00',
          body: '您的门禁权限激活申请已通过审批，请及时确认。[激活链接]',
        },
        {
          id: 'M-2026-2085',
          subject: '端午节假期安排通知',
          from: '钱敏 <qianmin@chumencloud.com>',
          time: '2026.06.16 09:00',
          body: '各部门：端午节假期为6月19日-6月21日，请提前安排好工作。',
        },
        {
          id: 'M-2026-2072',
          subject: '【项目评审】6月17日评审安排',
          from: '陈立 <chenli@chumencloud.com>',
          time: '2026.06.15 14:00',
          body: '产品研发部：周三下午3点B302会议室，赵总主持端午前上线方案评审。',
        },
        {
          id: 'M-2026-2055',
          subject: '工位区域的门禁权限变更提醒',
          from: '系统通知 <noreply@chumencloud.com>',
          time: '2026.06.14 08:30',
          body: '梁洛邑您好：您的门禁权限将于2026.06.17进行变更，验证方式由刷卡升级为刷卡+人脸识别。如有问题请联系行政部钱敏。[查看门禁详情]',
        },
      ],
      analysis: '门禁权限激活申请（M-2026-2098）里的激活链接就是解锁公司门禁的关键。门禁权限变更提醒（M-2026-2055）提到 06.17 当天门禁验证方式升级，恰好麻姐门禁卡在这个时候失效了。',
    },
  },

  'E-04': {
    id: 'E-04',
    name: '公司门禁记录——郑桥',
    type: 'data',
    source: '公司门禁系统',
    unlockSystem: '门禁',
    autoUnlock: false,
    content: {
      title: '郑桥工牌刷卡记录',
      data: [
        '12:48 —— 刷卡离开公司',
        '13:55 —— 刷卡进入公司',
      ],
      analysis: '郑桥 12:48 离开公司，13:55 才回来。他去提前离开健身房去干什么了？',
    },
  },

  'E-05': {
    id: 'E-05',
    name: '公司门禁记录——麻姐',
    type: 'data',
    source: '公司门禁系统',
    unlockSystem: '门禁',
    autoUnlock: false,
    content: {
      title: '麻姐工牌刷卡记录',
      data: [
        '13:53 —— 刷卡进入公司',
      ],
      analysis: '13:53 麻姐刷卡回公司了，但是没有离开公司的记录，是不是麻姐没有离开公司？',
    },
  },

  'E-06': {
    id: 'E-06',
    name: '公司停车场记录',
    type: 'data',
    source: '公司停车场系统',
    unlockSystem: '停车场',
    autoUnlock: false,
    content: {
      title: '2026年6月17日停车场车辆出入记录',
      data: [
        '鄂A·8K329 —— 郑桥的车辆，11:35 左右进出停车场',
      ],
      analysis: '根据郑桥和麻姐离开公司的时间推算，大概 11:35 左右离开停车场的车辆是郑桥的。利用车牌号可以在联动服务查询信息。',
    },
  },

  'E-07': {
    id: 'E-07',
    name: '超市监控',
    type: 'video',
    source: '广埠屯惠选超市公共监控接口',
    unlockSystem: '公共监控系统',
    autoUnlock: false,
    content: {
      title: '超市门口监控（11:43-11:53）',
      data: [
        '麻姐在超市门口与一名黑衣年轻男性交谈约10分钟',
        '麻姐购买三瓶水，递给黑衣男性一瓶',
        '黑衣男性身形瘦高，背吉他包',
        '麻姐离开后，黑衣男性在收银台外停留约3分钟',
      ],
      analysis: '黑衣男性很可能就是网友 Embrace。请玩家确认身形特征是否与 Embrace 的小红书照片一致。',
    },
  },

  'E-08': {
    id: 'E-08',
    name: '洗车店监控',
    type: 'video',
    source: '广捷洗车公共监控接口',
    unlockSystem: '公共监控系统',
    autoUnlock: false,
    content: {
      title: '广捷洗车监控（13:07-13:45）',
      data: [
        '13:07 —— 郑桥驾车进入洗车店，与洗车师傅交谈',
        '13:15 —— 郑桥进入洗车店卫生间',
        '13:45 —— 郑桥从卫生间出来',
        '13:50 —— 郑桥离开洗车店',
      ],
      analysis: '郑桥在卫生间待了 30 分钟，有点反常。',
    },
  },
};

// 系统名到系统全名的映射
const SYSTEM_NAMES = {
  'OA': 'OA 系统',
  '门禁': '公司门禁系统',
  '停车场': '公司停车场系统',
  '公共监控系统': '公共监控系统',
  '短信': '麻姐手机短信',
  '微信': '麻姐微信记录',
  '相册': '麻姐手机相册',
  '健身房': '炼健身会员系统',
  '信用查询': '个人信用查询系统',
};
