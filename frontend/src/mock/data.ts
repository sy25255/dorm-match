// ============================================
// 全局 Mock 数据 - 后端离线时自动启用
// ============================================

export const mockQuestions = [
  // SLEEP 维度 (5题)
  { id: 1, questionCode: 'SLEEP_01', dimension: 'SLEEP', questionText: '您通常的起床时间是？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"6:00之前"},{"label":"B","value":"2","text":"6:00-7:00"},{"label":"C","value":"3","text":"7:00-8:00"},{"label":"D","value":"4","text":"8:00-9:00"},{"label":"E","value":"5","text":"9:00之后"}]', sortOrder: 1, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 2, questionCode: 'SLEEP_02', dimension: 'SLEEP', questionText: '您通常的就寝时间是？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"22:00之前"},{"label":"B","value":"2","text":"22:00-23:00"},{"label":"C","value":"3","text":"23:00-24:00"},{"label":"D","value":"4","text":"24:00-1:00"},{"label":"E","value":"5","text":"1:00之后"}]', sortOrder: 2, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 3, questionCode: 'SLEEP_03', dimension: 'SLEEP', questionText: '您是否有午休习惯？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"每天必须午休"},{"label":"B","value":"2","text":"经常午休"},{"label":"C","value":"3","text":"偶尔午休"},{"label":"D","value":"4","text":"从不午休"}]', sortOrder: 3, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 4, questionCode: 'SLEEP_04', dimension: 'SLEEP', questionText: '您的作息规律程度如何？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常不规律"},{"label":"2","value":"2","text":"比较不规律"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较规律"},{"label":"5","value":"5","text":"非常规律"}]', sortOrder: 4, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 5, questionCode: 'SLEEP_05', dimension: 'SLEEP', questionText: '您对睡眠环境的安静程度要求？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"完全无所谓"},{"label":"2","value":"2","text":"不太在意"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较在意"},{"label":"5","value":"5","text":"非常在意，必须安静"}]', sortOrder: 5, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 84, questionCode: 'SLEEP_06', dimension: 'SLEEP', questionText: '你认为宿舍需要统一作息时间吗？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"非常有必要，统一作息对大家都好"},{"label":"B","value":"2","text":"可以有个参考时间，但灵活执行"},{"label":"C","value":"3","text":"不需要，各自按自己的节奏来"},{"label":"D","value":"4","text":"看舍友情况再商量决定"}]', sortOrder: 6, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // HYGIENE (6题)
  { id: 6, questionCode: 'HYGIENE_01', dimension: 'HYGIENE', questionText: '您个人洗澡频率？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"每天多次"},{"label":"B","value":"2","text":"每天一次"},{"label":"C","value":"3","text":"2-3天一次"},{"label":"D","value":"4","text":"3天以上一次"}]', sortOrder: 6, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 7, questionCode: 'HYGIENE_02', dimension: 'HYGIENE', questionText: '您的个人物品整理习惯？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常整洁有序"},{"label":"2","value":"2","text":"比较整洁"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较随意"},{"label":"5","value":"5","text":"非常随性自由"}]', sortOrder: 7, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 8, questionCode: 'HYGIENE_03', dimension: 'HYGIENE', questionText: '您是否愿意打扫公共区域？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常愿意，会主动打扫"},{"label":"2","value":"2","text":"愿意参与轮值"},{"label":"3","value":"3","text":"被提醒后会做"},{"label":"4","value":"4","text":"不太想做"},{"label":"5","value":"5","text":"完全不想做"}]', sortOrder: 8, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 9, questionCode: 'HYGIENE_04', dimension: 'HYGIENE', questionText: '对舍友卫生习惯的容忍程度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"零容忍"},{"label":"2","value":"2","text":"希望比较干净"},{"label":"3","value":"3","text":"基本整洁就行"},{"label":"4","value":"4","text":"比较宽容"},{"label":"5","value":"5","text":"完全不在乎"}]', sortOrder: 9, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 10, questionCode: 'HYGIENE_05', dimension: 'HYGIENE', questionText: '多久清理一次个人垃圾桶？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"每天清理"},{"label":"B","value":"2","text":"2-3天一次"},{"label":"C","value":"3","text":"满了再清理"},{"label":"D","value":"4","text":"被提醒才会清理"}]', sortOrder: 10, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 11, questionCode: 'HYGIENE_06', dimension: 'HYGIENE', questionText: '您是否习惯经常开窗通风？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"每天必须通风"},{"label":"2","value":"2","text":"经常通风"},{"label":"3","value":"3","text":"偶尔通风"},{"label":"4","value":"4","text":"很少开窗"},{"label":"5","value":"5","text":"几乎不通风"}]', sortOrder: 11, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 85, questionCode: 'HYGIENE_07', dimension: 'HYGIENE', questionText: '你对换洗衣服的态度是？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"换洗很勤，保持干净清爽很重要"},{"label":"2","value":"2","text":"比较在意，尽量勤换"},{"label":"3","value":"3","text":"一般，差不多干净就行"},{"label":"4","value":"4","text":"不太讲究，穿到有味道再换"},{"label":"5","value":"5","text":"我想怎么穿就怎么穿"}]', sortOrder: 12, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 87, questionCode: 'HYGIENE_08', dimension: 'HYGIENE', questionText: '在公共区域看到有垃圾时，你的第一反应是？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"顺手就收拾了，然后想想能不能牵头定个轮流打扫的办法","leaderScore":100},{"label":"B","value":"2","text":"先把自己那份清理了，在群里提醒一下大家","leaderScore":50},{"label":"C","value":"3","text":"等别人先动手吧，实在没人管的话我再做","leaderScore":15},{"label":"D","value":"4","text":"不是自己扔的就不管，总会有人看不过去收拾的","leaderScore":0}]', sortOrder: 13, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // STUDY (5题)
  { id: 12, questionCode: 'STUDY_01', dimension: 'STUDY', questionText: '您偏好的主要学习时间段？', questionType: 'MULTI_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"上午"},{"label":"B","value":"2","text":"下午"},{"label":"C","value":"3","text":"傍晚"},{"label":"D","value":"4","text":"深夜"}]', sortOrder: 12, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 13, questionCode: 'STUDY_02', dimension: 'STUDY', questionText: '您偏好什么样的学习环境？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"绝对安静"},{"label":"B","value":"2","text":"安静但可接受轻微声响"},{"label":"C","value":"3","text":"有点背景音也可以"},{"label":"D","value":"4","text":"无所谓什么环境"}]', sortOrder: 13, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 14, questionCode: 'STUDY_03', dimension: 'STUDY', questionText: '您更倾向于在哪里学习？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"主要在宿舍"},{"label":"B","value":"2","text":"主要在图书馆"},{"label":"C","value":"3","text":"各一半"},{"label":"D","value":"4","text":"看心情"}]', sortOrder: 14, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 15, questionCode: 'STUDY_04', dimension: 'STUDY', questionText: '您对小组学习/讨论的态度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常喜欢"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"可有可无"},{"label":"4","value":"4","text":"不太喜欢"},{"label":"5","value":"5","text":"非常排斥"}]', sortOrder: 15, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 16, questionCode: 'STUDY_05', dimension: 'STUDY', questionText: '学习时对周围交谈声的容忍度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"完全不能接受"},{"label":"2","value":"2","text":"小声交谈可以"},{"label":"3","value":"3","text":"一般交谈可以"},{"label":"4","value":"4","text":"比较吵闹也可以"},{"label":"5","value":"5","text":"完全不受影响"}]', sortOrder: 16, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // HOBBY (8题)
  { id: 17, questionCode: 'HOBBY_01', dimension: 'HOBBY', questionText: '您喜欢的运动类型？（多选）', questionType: 'MULTI_CHOICE', optionsJson: '[{"label":"A","value":"篮球","text":"篮球"},{"label":"B","value":"足球","text":"足球"},{"label":"C","value":"跑步","text":"跑步/健身"},{"label":"D","value":"羽毛球","text":"羽毛球/乒乓球"},{"label":"E","value":"游泳","text":"游泳"},{"label":"F","value":"瑜伽","text":"瑜伽/拉伸"},{"label":"G","value":"不运动","text":"不喜欢运动"}]', sortOrder: 17, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 18, questionCode: 'HOBBY_02', dimension: 'HOBBY', questionText: '您喜欢的音乐类型？（多选）', questionType: 'MULTI_CHOICE', optionsJson: '[{"label":"A","value":"流行","text":"流行"},{"label":"B","value":"摇滚","text":"摇滚/金属"},{"label":"C","value":"说唱","text":"说唱/嘻哈"},{"label":"D","value":"古典","text":"古典/纯音乐"},{"label":"E","value":"民谣","text":"民谣/独立"},{"label":"F","value":"电子","text":"电子/EDM"},{"label":"G","value":"不听","text":"很少听音乐"}]', sortOrder: 18, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 19, questionCode: 'HOBBY_03', dimension: 'HOBBY', questionText: '您的游戏习惯？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"重度玩家（每天3h+）"},{"label":"B","value":"2","text":"中度玩家（每天1-3h）"},{"label":"C","value":"3","text":"休闲玩家（偶尔玩玩）"},{"label":"D","value":"4","text":"完全不玩游戏"}]', sortOrder: 19, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 20, questionCode: 'HOBBY_04', dimension: 'HOBBY', questionText: '您的课外阅读偏好？（多选）', questionType: 'MULTI_CHOICE', optionsJson: '[{"label":"A","value":"文学","text":"文学/小说"},{"label":"B","value":"社科","text":"社科/历史"},{"label":"C","value":"科技","text":"科技/科普"},{"label":"D","value":"漫画","text":"漫画/轻小说"},{"label":"E","value":"自我提升","text":"自我提升"},{"label":"F","value":"不读","text":"基本不读"}]', sortOrder: 20, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 21, questionCode: 'HOBBY_05', dimension: 'HOBBY', questionText: '您喜欢的影视类型？（多选）', questionType: 'MULTI_CHOICE', optionsJson: '[{"label":"A","value":"电影","text":"电影"},{"label":"B","value":"电视剧","text":"电视剧"},{"label":"C","value":"动漫","text":"动漫/番剧"},{"label":"D","value":"综艺","text":"综艺"},{"label":"E","value":"纪录片","text":"纪录片"},{"label":"F","value":"不看","text":"很少看影视"}]', sortOrder: 21, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 22, questionCode: 'HOBBY_06', dimension: 'HOBBY', questionText: '您对户外活动的喜爱程度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常热衷"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"不太喜欢"},{"label":"5","value":"5","text":"完全不喜欢"}]', sortOrder: 22, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 23, questionCode: 'HOBBY_07', dimension: 'LIFESTYLE', questionText: '在宿舍播放媒体时习惯的音量？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"只用耳机"},{"label":"B","value":"2","text":"很小声外放"},{"label":"C","value":"3","text":"正常外放"},{"label":"D","value":"4","text":"比较大声"}]', sortOrder: 23, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 24, questionCode: 'HOBBY_08', dimension: 'LIFESTYLE', questionText: '对宿舍养小型宠物的态度？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"喜欢并支持"},{"label":"B","value":"2","text":"无所谓"},{"label":"C","value":"3","text":"不太接受"},{"label":"D","value":"4","text":"坚决反对"}]', sortOrder: 24, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 86, questionCode: 'HOBBY_09', dimension: 'HOBBY', questionText: '你喜欢吃什么美食？（多选）', questionType: 'MULTI_CHOICE', optionsJson: '[{"value":"川菜","text":"川菜/麻辣"},{"value":"粤菜","text":"粤菜/清淡"},{"value":"火锅","text":"火锅/串串"},{"value":"烧烤","text":"烧烤/烤肉"},{"value":"面食","text":"面食/小吃"},{"value":"甜品","text":"甜点/奶茶"},{"value":"日韩","text":"日料/韩餐"},{"value":"西餐","text":"西餐/轻食"},{"value":"家常","text":"家常菜/什么都吃"}]', sortOrder: 25, isRequired: 0, isAttentionCheck: 0, status: 1 },
  { id: 99, questionCode: 'HOBBY_10', dimension: 'HOBBY', questionText: '你对二次元文化及相关活动的喜爱程度是？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"深度爱好者，经常追番、玩二次元游戏，且有cosplay经历"},{"label":"B","value":"2","text":"中度爱好者，喜欢看动漫/玩二次元游戏，但没有cos过"},{"label":"C","value":"3","text":"轻度爱好者，偶尔会接触，不排斥"},{"label":"D","value":"4","text":"基本不了解也不感兴趣"}]', sortOrder: 26, isRequired: 0, isAttentionCheck: 0, status: 1 },
  // SOCIAL (5题)
  { id: 25, questionCode: 'SOCIAL_01', dimension: 'SOCIAL', questionText: '您期望的大学社交频率？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常频繁"},{"label":"2","value":"2","text":"比较频繁"},{"label":"3","value":"3","text":"适中"},{"label":"4","value":"4","text":"较少社交"},{"label":"5","value":"5","text":"很少社交，喜欢独处"}]', sortOrder: 25, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 26, questionCode: 'SOCIAL_02', dimension: 'SOCIAL', questionText: '对舍友在宿舍接待朋友的态度？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"非常欢迎"},{"label":"B","value":"2","text":"提前告知就可以"},{"label":"C","value":"3","text":"偶尔可以"},{"label":"D","value":"4","text":"最好不要"}]', sortOrder: 26, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 28, questionCode: 'SOCIAL_04', dimension: 'SOCIAL', questionText: '对宿舍集体活动的态度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常期待"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"顺其自然"},{"label":"4","value":"4","text":"偶尔即可"},{"label":"5","value":"5","text":"不太感兴趣"}]', sortOrder: 28, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 29, questionCode: 'SOCIAL_05', dimension: 'SOCIAL', questionText: '遇到矛盾时您倾向于？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"直接当面沟通"},{"label":"B","value":"2","text":"私下委婉沟通"},{"label":"C","value":"3","text":"通过第三方传达"},{"label":"D","value":"4","text":"默默忍受"},{"label":"E","value":"5","text":"不理对方"}]', sortOrder: 29, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 88, questionCode: 'SOCIAL_06', dimension: 'SOCIAL', questionText: '如果舍友遇到了问题（学习、情感、生活等方面），你一般会怎么做？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"主动关心，帮他一起分析问题，看看有什么能帮上忙的","leaderScore":100},{"label":"B","value":"2","text":"如果他主动来找我聊，我会耐心听并尽力帮忙","leaderScore":60},{"label":"C","value":"3","text":"简单问两句，但不太会深入介入","leaderScore":20},{"label":"D","value":"4","text":"每个人都有自己的事，不太方便过多打听","leaderScore":0}]', sortOrder: 30, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // SPENDING (4题)
  { id: 30, questionCode: 'SPEND_01', dimension: 'SPENDING', questionText: '您预估的月生活费水平？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"1000以下"},{"label":"B","value":"2","text":"1000-1500"},{"label":"C","value":"3","text":"1500-2000"},{"label":"D","value":"4","text":"2000-3000"},{"label":"E","value":"5","text":"3000以上"}]', sortOrder: 30, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 31, questionCode: 'SPEND_02', dimension: 'SPENDING', questionText: '对AA制的偏好？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"严格AA"},{"label":"B","value":"2","text":"大致AA即可"},{"label":"C","value":"3","text":"轮流请客"},{"label":"D","value":"4","text":"不计较"}]', sortOrder: 31, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 32, questionCode: 'SPEND_03', dimension: 'SPENDING', questionText: '对分享共用物品的态度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"很大方"},{"label":"2","value":"2","text":"比较愿意"},{"label":"3","value":"3","text":"各用各的"},{"label":"4","value":"4","text":"不太喜欢"},{"label":"5","value":"5","text":"完全不想"}]', sortOrder: 32, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 33, questionCode: 'SPEND_04', dimension: 'LIFESTYLE', questionText: '夏季空调温度偏好？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"22度以下"},{"label":"B","value":"2","text":"22-24度"},{"label":"C","value":"3","text":"24-26度"},{"label":"D","value":"4","text":"26度以上"},{"label":"E","value":"5","text":"不开空调"}]', sortOrder: 33, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // PERSONALITY (10题)
  { id: 34, questionCode: 'PERS_01', dimension: 'PERSONALITY', questionText: '在聚会中您通常会？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"成为焦点"},{"label":"B","value":"2","text":"和熟人聊天"},{"label":"C","value":"3","text":"安静坐角落"},{"label":"D","value":"4","text":"找借口不去"}]', sortOrder: 34, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 35, questionCode: 'PERS_02', dimension: 'PERSONALITY', questionText: '结识新朋友时您的感受？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常兴奋"},{"label":"2","value":"2","text":"比较愿意"},{"label":"3","value":"3","text":"需要一点时间"},{"label":"4","value":"4","text":"比较紧张"},{"label":"5","value":"5","text":"非常抗拒"}]', sortOrder: 35, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 27, questionCode: 'SOCIAL_03', dimension: 'PERSONALITY', questionText: '每天需要多长独处时间？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"几乎不需要"},{"label":"B","value":"2","text":"1小时以下"},{"label":"C","value":"3","text":"1-3小时"},{"label":"D","value":"4","text":"3小时以上"}]', sortOrder: 27, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 36, questionCode: 'PERS_03', dimension: 'PERSONALITY', questionText: '面对压力时您的表现？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"冷静应对"},{"label":"B","value":"2","text":"有些焦虑但能调节"},{"label":"C","value":"3","text":"比较焦虑需要倾诉"},{"label":"D","value":"4","text":"容易崩溃"}]', sortOrder: 36, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 37, questionCode: 'PERS_04', dimension: 'PERSONALITY', questionText: '您的情绪起伏程度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常稳定"},{"label":"2","value":"2","text":"比较稳定"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较起伏"},{"label":"5","value":"5","text":"大起大落"}]', sortOrder: 37, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 38, questionCode: 'PERS_05', dimension: 'PERSONALITY', questionText: '对新事物的接受程度？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常喜欢新事物"},{"label":"2","value":"2","text":"比较开放"},{"label":"3","value":"3","text":"看情况"},{"label":"4","value":"4","text":"比较保守"},{"label":"5","value":"5","text":"非常不喜欢变化"}]', sortOrder: 38, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 39, questionCode: 'PERS_06', dimension: 'PERSONALITY', questionText: '当舍友行为让您不舒服时？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"委婉体谅提醒"},{"label":"B","value":"2","text":"直接友善地说"},{"label":"C","value":"3","text":"忍很久才爆发"},{"label":"D","value":"4","text":"直接怼回去"}]', sortOrder: 39, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 40, questionCode: 'PERS_07', dimension: 'PERSONALITY', questionText: '是否愿意为团队和谐让步？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常愿意"},{"label":"2","value":"2","text":"比较愿意"},{"label":"3","value":"3","text":"视情况"},{"label":"4","value":"4","text":"不太愿意"},{"label":"5","value":"5","text":"不妥协"}]', sortOrder: 40, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 42, questionCode: 'PERS_09', dimension: 'PERSONALITY', questionText: '提前计划还是即兴行事？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"凡事必须计划"},{"label":"2","value":"2","text":"比较有计划"},{"label":"3","value":"3","text":"看情况"},{"label":"4","value":"4","text":"比较即兴"},{"label":"5","value":"5","text":"完全随性"}]', sortOrder: 42, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 43, questionCode: 'PERS_10', dimension: 'PERSONALITY', questionText: '您对宿舍氛围的期望？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"轻松幽默"},{"label":"B","value":"2","text":"友好温馨"},{"label":"C","value":"3","text":"安静有序"},{"label":"D","value":"4","text":"互不打扰"}]', sortOrder: 43, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // ATTENTION (3题)
  { id: 44, questionCode: 'ATTN_01', dimension: 'ATTENTION', questionText: '注意力检测：请选择"一般"', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常不同意"},{"label":"2","value":"2","text":"不同意"},{"label":"3","value":"3","text":"一般（请选此项）"},{"label":"4","value":"4","text":"同意"},{"label":"5","value":"5","text":"非常同意"}]', sortOrder: 44, isRequired: 0, isAttentionCheck: 1, status: 1 },
  { id: 45, questionCode: 'ATTN_02', dimension: 'ATTENTION', questionText: '注意力检测：请选第二个选项', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"选项一"},{"label":"B","value":"2","text":"选项二（请选此项）"},{"label":"C","value":"3","text":"选项三"}]', sortOrder: 45, isRequired: 0, isAttentionCheck: 1, status: 1 },
  { id: 46, questionCode: 'ATTN_03', dimension: 'ATTENTION', questionText: '注意力检测：请选"同意"', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"非常不同意"},{"label":"2","value":"2","text":"不同意"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"同意（请选此项）"},{"label":"5","value":"5","text":"非常同意"}]', sortOrder: 46, isRequired: 0, isAttentionCheck: 1, status: 1 },
  // ========== 基础信息采集（2题）==========
  { id: 47, questionCode: 'LIFE_01', dimension: 'LIFESTYLE', questionText: '您是否抽烟？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"是，有抽烟习惯"},{"label":"B","value":"2","text":"否，不抽烟"},{"label":"C","value":"3","text":"偶尔，社交场合才抽"}]', sortOrder: 47, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 48, questionCode: 'LIFE_02', dimension: 'SLEEP', questionText: '您睡觉时是否打呼噜？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"从不"},{"label":"B","value":"2","text":"轻微（偶有轻微鼾声）"},{"label":"C","value":"3","text":"严重（经常持续打鼾）"}]', sortOrder: 48, isRequired: 1, isAttentionCheck: 0, status: 1, hasSupplement: true, supplementPlaceholder: '如需补充说明（如已就医、使用呼吸机等），请在此填写...' },
  // ========== 价值观判断题（12题）==========
  { id: 51, questionCode: 'VALUE_03', dimension: 'PSYCHOLOGY', questionText: '没牵绳的大狗扑向自家小孩，爸爸一脚把狗踹成重伤，你觉得爸爸做得对吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"完全正确，保护孩子是本能，狗主人不牵绳有错在先"},{"label":"B","value":"2","text":"可以理解保护孩子，但下手太重了"},{"label":"C","value":"3","text":"制止狗就行，踹成重伤太过分了"},{"label":"D","value":"4","text":"双方都有责任，该追究狗主人不牵绳的问题"}]', sortOrder: 51, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 53, questionCode: 'VALUE_04', dimension: 'PSYCHOLOGY', questionText: '你觉得这两个人哪个更帅？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"蔡徐坤"},{"label":"B","value":"2","text":"张凌赫"},{"label":"C","value":"3","text":"都帅"},{"label":"D","value":"4","text":"自己"}]', sortOrder: 53, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 55, questionCode: 'VALUE_05', dimension: 'PSYCHOLOGY', questionText: '你觉得人和宠物的地位是一样的吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"生命都是平等的，宠物也有情感和权利"},{"label":"B","value":"2","text":"动物的地位比人高"},{"label":"C","value":"3","text":"不一样，人就是比宠物地位高"}]', sortOrder: 55, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 89, questionCode: 'VALUE_06', dimension: 'PSYCHOLOGY', questionText: '你觉得子女必须无条件孝顺父母吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"孝顺是传统美德，但要有底线和原则"},{"label":"B","value":"2","text":"父母养育之恩应该回报，但不能是完全无条件的"},{"label":"C","value":"3","text":"每代人都有自己的责任，互相尊重比无条件服从更重要"},{"label":"D","value":"4","text":"看父母怎么对待子女，爱是相互的"}]', sortOrder: 56, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 90, questionCode: 'VALUE_07', dimension: 'PSYCHOLOGY', questionText: '你觉得人的生命永远比动物的生命更重要吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"是的，人类具有更高的道德地位"},{"label":"B","value":"2","text":"大多数情况下是，但在极端虐待动物等情况下另论"},{"label":"C","value":"3","text":"人和动物的生命都很重要，不能简单排序"},{"label":"D","value":"4","text":"不是，动物的生命更重要"}]', sortOrder: 57, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 91, questionCode: 'VALUE_08', dimension: 'PSYCHOLOGY', questionText: '你觉得人性本善，还是人性本恶？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"人性本善"},{"label":"B","value":"2","text":"人性本恶"},{"label":"C","value":"3","text":"人性既非本善也非本恶"},{"label":"D","value":"4","text":"这个问题太哲学了，我觉得没有那么简单的答案"}]', sortOrder: 58, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 92, questionCode: 'VALUE_09', dimension: 'PSYCHOLOGY', questionText: '你觉得弱者就该被无条件同情吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"是的，帮助弱者是文明社会的底线"},{"label":"B","value":"2","text":"应该同情但不应该是无条件的，也要看具体原因"},{"label":"C","value":"3","text":"弱者也有自己的责任，不能因为是弱者就对一切都免责"},{"label":"D","value":"4","text":"同情和尊重并行，帮助弱者的同时也要尊重他们的自主性"}]', sortOrder: 59, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 93, questionCode: 'VALUE_10', dimension: 'PSYCHOLOGY', questionText: '你觉得生命的意义在于享乐，还是在于奋斗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"生命的意义在于追求快乐和体验美好"},{"label":"B","value":"2","text":"奋斗和创造价值才是真正的意义所在"},{"label":"C","value":"3","text":"两者不冲突，在奋斗中也能找到快乐"},{"label":"D","value":"4","text":"每个人对意义的理解都不同，不需要统一答案"}]', sortOrder: 60, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 94, questionCode: 'VALUE_11', dimension: 'PSYCHOLOGY', questionText: '你觉得对不同肤色的人种，应该无差别平等对待吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"应该"},{"label":"B","value":"2","text":"不应该"}]', sortOrder: 61, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 95, questionCode: 'VALUE_12', dimension: 'PSYCHOLOGY', questionText: '你觉得男女之间有纯友谊吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"当然有，友谊不分性别"},{"label":"B","value":"2","text":"可能存在，但比较难得，需要两人都有清醒的边界感"},{"label":"C","value":"3","text":"很难，总有一方会有超越友谊的想法"},{"label":"D","value":"4","text":"因人而异，有人能有，有人不能有"}]', sortOrder: 62, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 96, questionCode: 'VALUE_13', dimension: 'PSYCHOLOGY', questionText: '岳飞是中华民族的民族英雄吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"是"},{"label":"B","value":"2","text":"不是"}]', sortOrder: 63, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 97, questionCode: 'VALUE_14', dimension: 'PSYCHOLOGY', questionText: '电车问题：一辆失控的电车正冲向五个被绑在轨道上的工人，你可以拉一个拉杆让电车转向另一条轨道，但另一条轨道上绑着一个人。你会拉下拉杆吗？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"救5个人"},{"label":"B","value":"2","text":"救一个人"}]', sortOrder: 64, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 98, questionCode: 'VALUE_15', dimension: 'PSYCHOLOGY', questionText: '台湾是否属于中国的领土？', questionType: 'VALUE_JUDGE', optionsJson: '[{"label":"A","value":"1","text":"是"},{"label":"B","value":"2","text":"不是"}]', sortOrder: 65, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // ========== 扩展信息（2题）==========
  { id: 56, questionCode: 'EXT_01', dimension: 'EXTENSION', questionText: '你未来4年是否有明确的学习或职业发展计划？请简述。', questionType: 'LONG_TEXT', optionsJson: null, sortOrder: 56, isRequired: 0, isAttentionCheck: 0, status: 1, placeholder: '例如：计划考研/出国/考公/创业/就业，目标院校或企业等...' },
  { id: 57, questionCode: 'EXT_02', dimension: 'EXTENSION', questionText: '你是否介意舍友在宿舍进行自媒体视频拍摄活动？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"非常介意，不希望宿舍有拍摄活动"},{"label":"B","value":"2","text":"可以接受，但需提前协商时间和范围"},{"label":"C","value":"3","text":"完全不介意，支持舍友创作"},{"label":"D","value":"4","text":"看拍摄内容和频率再决定"}]', sortOrder: 57, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // ========== 隐性领导力题（2题，已融入各维度，用户不可见"领导力"标签）==========
  { id: 58, questionCode: 'LEAD_01', dimension: 'PERSONALITY', questionText: '做小组项目时，关于分工和进度，你一般是怎么参与的？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"习惯先看看整体情况，然后提议怎么分工会更顺","leaderScore":100},{"label":"B","value":"2","text":"领到自己那部分就认真做完，不太操心别人的进度","leaderScore":40},{"label":"C","value":"3","text":"喜欢一个人把大部分内容都做了，觉得这样效率更高","leaderScore":20},{"label":"D","value":"4","text":"看大家怎么安排就怎么来，跟着走就行","leaderScore":0}]', sortOrder: 58, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 60, questionCode: 'LEAD_03', dimension: 'SPENDING', questionText: '宿舍里有些公共开销（水电网费、清洁用品等），你觉得怎么处理比较好？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"我可以牵头建个群收款，每笔都记清楚，大家AA","leaderScore":100},{"label":"B","value":"2","text":"有人组织的话我就配合，没人组织的话我也可以试试","leaderScore":60},{"label":"C","value":"3","text":"随缘吧，谁方便谁先付，差不多就行","leaderScore":25},{"label":"D","value":"4","text":"最好学校直接统一收，不用我们自己操心","leaderScore":0}]', sortOrder: 60, isRequired: 1, isAttentionCheck: 0, status: 1 },
  // ========== 防无效验证题（11题，每分区1题，随机穿插，禁首尾）==========
  { id: 63, questionCode: 'TRAP_01', dimension: 'TRAP', questionText: '（验证题）请选择选项B', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"选项A"},{"label":"B","value":"2","text":"请选此项（正确答案）"},{"label":"C","value":"3","text":"选项C"},{"label":"D","value":"4","text":"选项D"}]', sortOrder: 63, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '2', trapSection: 'hygiene' },
  { id: 64, questionCode: 'TRAP_02', dimension: 'TRAP', questionText: '（验证题）一加一等于几？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"1"},{"label":"B","value":"2","text":"2"},{"label":"C","value":"3","text":"3"},{"label":"D","value":"4","text":"11"}]', sortOrder: 64, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '2', trapSection: 'study' },
  { id: 65, questionCode: 'TRAP_03', dimension: 'TRAP', questionText: '（验证题）一年有几个季节？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"2个"},{"label":"B","value":"2","text":"3个"},{"label":"C","value":"3","text":"4个"},{"label":"D","value":"4","text":"5个"}]', sortOrder: 65, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '3', trapSection: 'hobby' },
  { id: 66, questionCode: 'TRAP_04', dimension: 'TRAP', questionText: '（验证题）太阳从哪个方向升起？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"东边"},{"label":"B","value":"2","text":"西边"},{"label":"C","value":"3","text":"南边"},{"label":"D","value":"4","text":"北边"}]', sortOrder: 66, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '1', trapSection: 'social' },
  { id: 67, questionCode: 'TRAP_05', dimension: 'TRAP', questionText: '（验证题）请直接选择第三个选项即可。', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"红色"},{"label":"B","value":"2","text":"蓝色"},{"label":"C","value":"3","text":"请选此项"},{"label":"D","value":"4","text":"绿色"}]', sortOrder: 67, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '3', trapSection: 'spending' },
  { id: 68, questionCode: 'TRAP_06', dimension: 'TRAP', questionText: '（验证题）一周有几天？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"5天"},{"label":"B","value":"2","text":"6天"},{"label":"C","value":"3","text":"7天"},{"label":"D","value":"4","text":"8天"}]', sortOrder: 68, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '3', trapSection: 'personality' },
  { id: 69, questionCode: 'TRAP_07', dimension: 'TRAP', questionText: '（验证题）五十加五十等于多少？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"50"},{"label":"B","value":"2","text":"100"},{"label":"C","value":"3","text":"150"},{"label":"D","value":"4","text":"0"}]', sortOrder: 69, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '2', trapSection: 'psychology' },
  { id: 70, questionCode: 'TRAP_08', dimension: 'TRAP', questionText: '（验证题）请选择"同意"这个选项。', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"不同意"},{"label":"B","value":"2","text":"非常不同意"},{"label":"C","value":"3","text":"同意（请选此项）"},{"label":"D","value":"4","text":"不确定"}]', sortOrder: 70, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '3', trapSection: 'extension' },
  { id: 71, questionCode: 'TRAP_09', dimension: 'TRAP', questionText: '（验证题）请忽略此题的选择，直接选最后一个选项。', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"苹果"},{"label":"B","value":"2","text":"香蕉"},{"label":"C","value":"3","text":"橘子"},{"label":"D","value":"4","text":"请选此项"}]', sortOrder: 71, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '4', trapSection: 'sleep' },
  { id: 72, questionCode: 'TRAP_10', dimension: 'TRAP', questionText: '（验证题）中国有多少个直辖市？请选择4个。', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"2个"},{"label":"B","value":"2","text":"3个"},{"label":"C","value":"3","text":"4个（北京、上海、天津、重庆）"},{"label":"D","value":"4","text":"5个"}]', sortOrder: 72, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '3', trapSection: 'scenario' },
  { id: 73, questionCode: 'TRAP_11', dimension: 'TRAP', questionText: '（验证题）水在标准大气压下多少度沸腾？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"50°C"},{"label":"B","value":"2","text":"100°C"},{"label":"C","value":"3","text":"150°C"},{"label":"D","value":"4","text":"200°C"}]', sortOrder: 73, isRequired: 1, isAttentionCheck: 0, status: 1, trapAnswer: '2', trapSection: 'attention' },
  // ========== 个人信息补充（2题）==========
  { id: 74, questionCode: 'INFO_01', dimension: 'LIFESTYLE', questionText: '你的性取向是？（仅用于匹配参考，严格保密）', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"异性恋"},{"label":"B","value":"2","text":"同性恋"},{"label":"C","value":"3","text":"双性恋"},{"label":"D","value":"4","text":"不确定/不愿透露"}]', sortOrder: 74, isRequired: 0, isAttentionCheck: 0, status: 1 },
  { id: 75, questionCode: 'INFO_02', dimension: 'PSYCHOLOGY', questionText: '对于同性恋群体，你的态度更接近以下哪种描述？', questionType: 'LIKERT5', optionsJson: '[{"label":"1","value":"1","text":"完全理解和接纳，支持平等权利"},{"label":"2","value":"2","text":"比较理解，尊重个人选择"},{"label":"3","value":"3","text":"中立，不特别关注"},{"label":"4","value":"4","text":"不太理解，但尊重法律保护的权利"},{"label":"5","value":"5","text":"不接受，认为不符合传统价值观"}]', sortOrder: 75, isRequired: 0, isAttentionCheck: 0, status: 1 },
  // ========== 个人信息补充（3题）==========
  { id: 81, questionCode: 'LIFE_03', dimension: 'LIFESTYLE', questionText: '您是否喝酒？', questionType: 'SINGLE_CHOICE', optionsJson: '[{"label":"A","value":"1","text":"是，有饮酒习惯"},{"label":"B","value":"2","text":"否，不喝酒"},{"label":"C","value":"3","text":"偶尔，社交场合才喝"}]', sortOrder: 81, isRequired: 1, isAttentionCheck: 0, status: 1 },
  { id: 82, questionCode: 'BG_01', dimension: 'LIFESTYLE', questionText: '你来自哪个省/直辖市/自治区？', questionType: 'DROPDOWN', optionsJson: '[{"value":"北京","text":"北京市"},{"value":"天津","text":"天津市"},{"value":"上海","text":"上海市"},{"value":"重庆","text":"重庆市"},{"value":"河北","text":"河北省"},{"value":"山西","text":"山西省"},{"value":"内蒙古","text":"内蒙古自治区"},{"value":"辽宁","text":"辽宁省"},{"value":"吉林","text":"吉林省"},{"value":"黑龙江","text":"黑龙江省"},{"value":"江苏","text":"江苏省"},{"value":"浙江","text":"浙江省"},{"value":"安徽","text":"安徽省"},{"value":"福建","text":"福建省"},{"value":"江西","text":"江西省"},{"value":"山东","text":"山东省"},{"value":"河南","text":"河南省"},{"value":"湖北","text":"湖北省"},{"value":"湖南","text":"湖南省"},{"value":"广东","text":"广东省"},{"value":"广西","text":"广西壮族自治区"},{"value":"海南","text":"海南省"},{"value":"四川","text":"四川省"},{"value":"贵州","text":"贵州省"},{"value":"云南","text":"云南省"},{"value":"西藏","text":"西藏自治区"},{"value":"陕西","text":"陕西省"},{"value":"甘肃","text":"甘肃省"},{"value":"青海","text":"青海省"},{"value":"宁夏","text":"宁夏回族自治区"},{"value":"新疆","text":"新疆维吾尔自治区"},{"value":"香港","text":"香港特别行政区"},{"value":"澳门","text":"澳门特别行政区"},{"value":"台湾","text":"台湾省"}]', sortOrder: 82, isRequired: 1, isAttentionCheck: 0, status: 1, dropdownPlaceholder: '请选择省份/直辖市/自治区' },
  { id: 83, questionCode: 'BG_02', dimension: 'LIFESTYLE', questionText: '你的民族是？', questionType: 'DROPDOWN', optionsJson: '[{"value":"汉族","text":"汉族"},{"value":"壮族","text":"壮族"},{"value":"回族","text":"回族"},{"value":"满族","text":"满族"},{"value":"维吾尔族","text":"维吾尔族"},{"value":"苗族","text":"苗族"},{"value":"彝族","text":"彝族"},{"value":"土家族","text":"土家族"},{"value":"藏族","text":"藏族"},{"value":"蒙古族","text":"蒙古族"},{"value":"侗族","text":"侗族"},{"value":"布依族","text":"布依族"},{"value":"瑶族","text":"瑶族"},{"value":"白族","text":"白族"},{"value":"朝鲜族","text":"朝鲜族"},{"value":"哈尼族","text":"哈尼族"},{"value":"黎族","text":"黎族"},{"value":"哈萨克族","text":"哈萨克族"},{"value":"傣族","text":"傣族"},{"value":"畲族","text":"畲族"},{"value":"僳僳族","text":"僳僳族"},{"value":"东乡族","text":"东乡族"},{"value":"仡佬族","text":"仡佬族"},{"value":"拉祜族","text":"拉祜族"},{"value":"佤族","text":"佤族"},{"value":"水族","text":"水族"},{"value":"纳西族","text":"纳西族"},{"value":"羌族","text":"羌族"},{"value":"土族","text":"土族"},{"value":"仫佬族","text":"仫佬族"},{"value":"锡伯族","text":"锡伯族"},{"value":"柯尔克孜族","text":"柯尔克孜族"},{"value":"景颇族","text":"景颇族"},{"value":"达斡尔族","text":"达斡尔族"},{"value":"撒拉族","text":"撒拉族"},{"value":"布朗族","text":"布朗族"},{"value":"毛南族","text":"毛南族"},{"value":"塔吉克族","text":"塔吉克族"},{"value":"普米族","text":"普米族"},{"value":"阿昌族","text":"阿昌族"},{"value":"怒族","text":"怒族"},{"value":"鄂温克族","text":"鄂温克族"},{"value":"京族","text":"京族"},{"value":"基诺族","text":"基诺族"},{"value":"德昂族","text":"德昂族"},{"value":"保安族","text":"保安族"},{"value":"俄罗斯族","text":"俄罗斯族"},{"value":"裕固族","text":"裕固族"},{"value":"乌孜别克族","text":"乌孜别克族"},{"value":"门巴族","text":"门巴族"},{"value":"鄂伦春族","text":"鄂伦春族"},{"value":"独龙族","text":"独龙族"},{"value":"赫哲族","text":"赫哲族"},{"value":"高山族","text":"高山族"},{"value":"珞巴族","text":"珞巴族"},{"value":"塔塔尔族","text":"塔塔尔族"},{"value":"其他","text":"其他民族"}]', sortOrder: 83, isRequired: 1, isAttentionCheck: 0, status: 1, dropdownPlaceholder: '请选择民族' },
]

export const mockSurveySections = [
  { key: 'basic', title: '基础信息采集', desc: '生活习惯与健康信息', color: '#1890ff', questionIds: [47, 48, 81, 82, 83] },
  { key: 'sleep', title: '生活作息', desc: '了解你的睡眠和作息习惯', color: '#722ed1', questionIds: [1, 2, 3, 4, 5, 84, 64] },
  { key: 'hygiene', title: '卫生习惯', desc: '个人卫生与公共区域维护', color: '#13c2c2', questionIds: [6, 7, 8, 9, 10, 11, 85, 87, 65] },
  { key: 'study', title: '学习习惯', desc: '学习时间与环境偏好', color: '#52c41a', questionIds: [12, 13, 14, 15, 16, 66] },
  { key: 'hobby', title: '兴趣爱好', desc: '运动、音乐、游戏等兴趣偏好', color: '#fa8c16', questionIds: [17, 18, 19, 20, 21, 22, 23, 24, 86, 99, 67] },
  { key: 'social', title: '社交偏好', desc: '社交习惯与沟通方式', color: '#eb2f96', questionIds: [25, 26, 27, 28, 29, 88, 68] },
  { key: 'spending', title: '消费观念', desc: '消费习惯与共享态度', color: '#faad14', questionIds: [30, 31, 32, 33, 69] },
  { key: 'personality', title: '性格特征', desc: '性格特质与处事风格', color: '#2f54eb', questionIds: [34, 35, 36, 37, 38, 39, 40, 42, 43, 74, 75] },
  { key: 'attention', title: '注意力检测', desc: '请认真阅读每个题目，根据真实情况作答', color: '#f5222d', questionIds: [44, 45, 46] },
  { key: 'scenario', title: '价值观判断', desc: '通过社会热点事件与道德困境，了解你的核心价值观（匿名分析，仅用于匹配）', color: '#a0d911', questionIds: [51, 55, 89, 90, 91, 92, 93, 94, 95, 96, 97, 53, 98] },
  { key: 'extension', title: '扩展信息', desc: '学习规划与宿舍生活偏好', color: '#5b8c00', questionIds: [56, 57] },
  { key: 'intro', title: '自我介绍', desc: '让未来的舍友更好地了解你', color: '#595959', questionIds: [] },
]

export const mockScenarioTraits: Record<string, string> = {
  '沟通协调': '善于通过沟通化解分歧，注重人际和谐',
  '责任担当': '愿意主动承担，有强烈责任心',
  '集体协作': '注重团队力量和集体行动',
  '规则导向': '重视规则和程序正义',
  '隐忍克制': '遇到冲突先自我消化，避免正面冲突',
  '直接沟通': '坦率表达需求，面对面解决问题',
  '间接表达': '偏好缓冲式沟通，减少面对面压力',
  '主动回避': '选择主动退出或远离冲突场景',
  '计划执行': '通过结构化方法管理压力',
  '情感求助': '需要社会支持系统应对压力',
  '自我调节': '善于通过健康方式自我疏导',
  '灵活应对': '能根据实际情况弹性调整策略',
  '以身作则': '用行动示范，带动他人',
  '主动组织': '喜欢发起和协调集体行动',
  '界限分明': '明确区分个人责任与他人的边界',
  '被动等待': '倾向等待他人先采取行动',
  '善意规劝': '私下温和提醒，维护关系',
  '回避容忍': '优先选择不介入他人的行为',
  '价值沟通': '愿意就价值观差异进行深入讨论',
  '规则维护': '通过正式渠道维护规范',
  '温暖关怀': '主动给予情感支持和关心',
  '尊重空间': '尊重他人独立处理问题的空间',
  '谨慎观察': '先收集信息再做判断',
  '行动支持': '通过实际行动表达关心',
  '协商折中': '追求公平的妥协方案',
  '轮换公平': '通过制度化的轮流机制解决分歧',
  '主动让步': '愿意牺牲部分个人偏好以维护关系',
  '制度参考': '寻求外部规范作为解决依据',
}

export const mockSelfIntroTemplate = {
  hobbies: '',
  personality: '',
  specialConditions: '',
  bio: '',
}

export const mockStudents = [
  { id: 1, name: '张伟', studentNo: '20240001', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '北京', avatarUrl: '', bio: '热爱编程和篮球，希望找到志同道合的舍友', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 85, mayBeDormLeader: true },
  { id: 2, name: '李明', studentNo: '20240002', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '上海', avatarUrl: '', bio: '喜欢安静的学习环境，作息规律', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 72, mayBeDormLeader: false },
  { id: 3, name: '王强', studentNo: '20240003', gender: 1, collegeName: '计算机学院', majorName: '软件工程', hometown: '广州', avatarUrl: '', bio: '重度游戏玩家，希望能找到一起开黑的舍友', smoking: '1', snoring: '3', smokingLabel: '抽烟', snoringLabel: '打呼噜严重', isValid: false, leaderScore: 30, mayBeDormLeader: false },
  { id: 4, name: '赵刚', studentNo: '20240004', gender: 1, collegeName: '电子学院', majorName: '通信工程', hometown: '深圳', avatarUrl: '', bio: '喜欢运动和户外，性格开朗', smoking: '2', snoring: '2', smokingLabel: '不抽烟', snoringLabel: '打呼噜轻微', isValid: true, leaderScore: 78, mayBeDormLeader: true },
  { id: 5, name: '孙磊', studentNo: '20240005', gender: 1, collegeName: '电子学院', majorName: '通信工程', hometown: '杭州', avatarUrl: '', bio: '性格内向，喜欢独处和阅读', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 40, mayBeDormLeader: false },
  { id: 6, name: '刘洋', studentNo: '20240006', gender: 1, collegeName: '计算机学院', majorName: '人工智能', hometown: '成都', avatarUrl: '', bio: '音乐爱好者，会弹吉他', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 65, mayBeDormLeader: false },
  { id: 7, name: '陈宇', studentNo: '20240007', gender: 1, collegeName: '理学院', majorName: '数学', hometown: '武汉', avatarUrl: '', bio: '喜欢整洁，希望舍友也有良好的卫生习惯', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 55, mayBeDormLeader: false },
  { id: 8, name: '周杰', studentNo: '20240008', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '南京', avatarUrl: '', bio: '夜猫子，喜欢深夜学习和写代码', smoking: '3', snoring: '2', smokingLabel: '偶尔抽烟', snoringLabel: '打呼噜轻微', isValid: true, leaderScore: 48, mayBeDormLeader: false },
  { id: 9, name: '王芳', studentNo: '20240011', gender: 0, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '北京', avatarUrl: '', bio: '喜欢整洁安静的环境，作息规律', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 82, mayBeDormLeader: true },
  { id: 10, name: '李娜', studentNo: '20240012', gender: 0, collegeName: '计算机学院', majorName: '软件工程', hometown: '上海', avatarUrl: '', bio: '性格开朗，喜欢社交和集体活动', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 90, mayBeDormLeader: true },
  { id: 11, name: '张雪', studentNo: '20240013', gender: 0, collegeName: '电子学院', majorName: '通信工程', hometown: '广州', avatarUrl: '', bio: '喜欢追剧和看综艺', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 50, mayBeDormLeader: false },
  { id: 12, name: '刘婷', studentNo: '20240014', gender: 0, collegeName: '计算机学院', majorName: '人工智能', hometown: '杭州', avatarUrl: '', bio: '文艺青年，喜欢阅读和写作', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: false, leaderScore: 35, mayBeDormLeader: false },
  { id: 13, name: '陈静', studentNo: '20240015', gender: 0, collegeName: '理学院', majorName: '数学', hometown: '武汉', avatarUrl: '', bio: '性格比较内向，喜欢独处', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 42, mayBeDormLeader: false },
  { id: 14, name: '赵敏', studentNo: '20240016', gender: 0, collegeName: '外语学院', majorName: '英语', hometown: '深圳', avatarUrl: '', bio: '热爱运动健身，每天跑步', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 68, mayBeDormLeader: false },
  { id: 15, name: '周雨', studentNo: '20240017', gender: 0, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '成都', avatarUrl: '', bio: '喜欢游戏和动漫', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 38, mayBeDormLeader: false },
  { id: 16, name: '吴桐', studentNo: '20240018', gender: 0, collegeName: '电子学院', majorName: '通信工程', hometown: '南京', avatarUrl: '', bio: '注重生活品质，爱干净', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 75, mayBeDormLeader: true },
  { id: 17, name: '林思雨', studentNo: '20240019', gender: 0, collegeName: '外语学院', majorName: '日语', hometown: '厦门', avatarUrl: '', bio: '温柔细心，喜欢整理收纳和养多肉植物', smoking: '2', snoring: '1', smokingLabel: '不抽烟', snoringLabel: '不打呼噜', isValid: true, leaderScore: 88, mayBeDormLeader: true },
]

export const mockRecommendations = [
  { studentId: 2, name: '李明', avatarUrl: '', collegeName: '计算机学院', majorName: '计算机科学与技术', bio: '喜欢安静的学习环境，作息规律', matchScore: 88.5, dimensionScores: { LIFESTYLE: 95, SLEEP: 92, HYGIENE: 85, SOCIAL: 80, PERSONALITY: 88, STUDY: 90, HOBBY: 82, SPENDING: 78, PSYCHOLOGY: 90 }, commonTags: ['不抽烟', '不打呼噜', '跑步', '科技', '纪录片', '安静', '观点相似'], lifestyleCompat: { smoking: 'compatible', snoring: 'compatible' }, psychCompat: 90, leaderScore: 72, mayBeDormLeader: false, isValid: true },
  { studentId: 4, name: '赵刚', avatarUrl: '', collegeName: '电子学院', majorName: '通信工程', bio: '喜欢运动和户外，性格开朗', matchScore: 81.2, dimensionScores: { LIFESTYLE: 75, SLEEP: 78, HYGIENE: 75, SOCIAL: 90, PERSONALITY: 85, STUDY: 70, HOBBY: 92, SPENDING: 75, PSYCHOLOGY: 78 }, commonTags: ['不抽烟', '篮球', '运动', '户外', '观点相似'], lifestyleCompat: { smoking: 'compatible', snoring: 'warning' }, psychCompat: 78, leaderScore: 78, mayBeDormLeader: true, isValid: true },
  { studentId: 6, name: '刘洋', avatarUrl: '', collegeName: '计算机学院', majorName: '人工智能', bio: '音乐爱好者，会弹吉他', matchScore: 76.8, dimensionScores: { LIFESTYLE: 80, SLEEP: 72, HYGIENE: 75, SOCIAL: 82, PERSONALITY: 80, STUDY: 75, HOBBY: 88, SPENDING: 72, PSYCHOLOGY: 74 }, commonTags: ['不抽烟', '音乐', '电影', '民谣', '三观接近'], lifestyleCompat: { smoking: 'compatible', snoring: 'compatible' }, psychCompat: 74, leaderScore: 65, mayBeDormLeader: false, isValid: true },
  { studentId: 7, name: '陈宇', avatarUrl: '', collegeName: '理学院', majorName: '数学', bio: '喜欢整洁，希望舍友也有良好的卫生习惯', matchScore: 74.0, dimensionScores: { LIFESTYLE: 85, SLEEP: 85, HYGIENE: 95, SOCIAL: 65, PERSONALITY: 72, STUDY: 78, HOBBY: 55, SPENDING: 60, PSYCHOLOGY: 68 }, commonTags: ['不抽烟', '整洁', '安静', '规律'], lifestyleCompat: { smoking: 'compatible', snoring: 'compatible' }, psychCompat: 68, leaderScore: 55, mayBeDormLeader: false, isValid: true },
  { studentId: 5, name: '孙磊', avatarUrl: '', collegeName: '电子学院', majorName: '通信工程', bio: '性格内向，喜欢独处和阅读', matchScore: 68.3, dimensionScores: { LIFESTYLE: 78, SLEEP: 80, HYGIENE: 82, SOCIAL: 40, PERSONALITY: 55, STUDY: 85, HOBBY: 65, SPENDING: 70, PSYCHOLOGY: 62 }, commonTags: ['不抽烟', '阅读', '安静'], lifestyleCompat: { smoking: 'compatible', snoring: 'compatible' }, psychCompat: 62, leaderScore: 40, mayBeDormLeader: false, isValid: true },
  { studentId: 3, name: '王强', avatarUrl: '', collegeName: '计算机学院', majorName: '软件工程', bio: '重度游戏玩家，希望能找到一起开黑的舍友', matchScore: 55.0, dimensionScores: { LIFESTYLE: 30, SLEEP: 30, HYGIENE: 45, SOCIAL: 70, PERSONALITY: 60, STUDY: 40, HOBBY: 75, SPENDING: 55, PSYCHOLOGY: 42 }, commonTags: ['篮球', '游戏'], lifestyleCompat: { smoking: 'conflict', snoring: 'conflict' }, psychCompat: 42, leaderScore: 30, mayBeDormLeader: false, isValid: false },
]

export const mockQuota = { maxSent: 5, usedSent: 1, remainingSent: 4, maxReceived: 10, usedReceived: 2, remainingReceived: 8 }

export const mockPairing = { id: 1, pairingCode: 'demo-pairing-000', groupSize: 2, status: 1, lockedAt: '2024-08-25T10:00:00', createdAt: '2024-08-25T09:30:00' }

export const mockPairingMembers = [
  { studentId: 1, name: '张伟', avatarUrl: '', isInitiator: 0 },
  { studentId: 2, name: '李明', avatarUrl: '', isInitiator: 0 },
]

export const mockAllocation = {
  allocationId: 1, roomId: 1, roomNumber: 'M1-101', bedNo: 1,
  allocationType: 'SELF_SELECT', status: 'CONFIRMED', confirmedByStudent: 1,
  roommates: [
    { studentId: 2, name: '李明', bedNo: 2, allocationType: 'SELF_SELECT' },
    { studentId: 6, name: '刘洋', bedNo: 3, allocationType: 'ALGORITHM' },
    { studentId: 8, name: '周杰', bedNo: 4, allocationType: 'ALGORITHM' },
  ]
}

export function getMockMatchDetail(targetId: number) {
  const rec = mockRecommendations.find(r => r.studentId === targetId)
  if (!rec) return null
  const student = mockStudents.find(s => s.id === targetId)
  return {
    name: rec.name,
    hometown: student?.hometown || '未填写',
    bio: student?.bio || '',
    totalScore: rec.matchScore,
    dimensionScores: rec.dimensionScores,
    commonTags: rec.commonTags,
  }
}

export const mockSearchResults = mockStudents.slice(2, 8).map(s => {
  const rec = mockRecommendations.find(r => r.studentId === s.id)
  return {
    studentId: s.id,
    name: s.name,
    collegeName: s.collegeName,
    majorName: s.majorName,
    bio: s.bio,
    matchScore: rec?.matchScore ?? Math.floor(50 + Math.random() * 40),
    hometown: s.hometown,
  }
})

export const mockObjections = [
  { id: 1, reason: '希望能换到M1-201房间', status: 0, createdAt: '2024-08-26T09:00:00' },
]

// ========== 学校多租户数据 ==========

export const mockSchools = [
  { code: 'DEMO-UNI', name: '示范大学', shortName: '示范大', adminEmail: 'admin@demo-uni.edu.cn', status: 1, description: '示范大学是一所综合性大学，设有6个学院，涵盖理工文管等多个学科。' },
  { code: 'TEST', name: '测试学院', shortName: '测试院', adminEmail: 'admin@test.edu.cn', status: 1, description: '用于系统测试的虚拟学院。' },
  { code: 'BJ-UNI', name: '北京大学', shortName: '北大', adminEmail: 'admin@pku.edu.cn', status: 1, description: '中国顶尖综合性研究型大学。' },
  { code: 'SH-UNI', name: '上海大学', shortName: '上大', adminEmail: 'admin@shu.edu.cn', status: 1, description: '上海市属综合性大学。' },
]

export function getSchoolByCode(code: string) {
  return mockSchools.find(s => s.code === code) || null
}

// ========== 管理后台数据 ==========

export const mockAllStudents = [
  ...mockStudents.map((s, i) => ({
    ...s,
    email: `${s.studentNo}@school.edu.cn`,
    phone: `138${String(10000000 + i).slice(0, 8)}`,
    surveyStatus: i < 10 ? 2 : i < 13 ? 1 : 0,
    matchStatus: i < 6 ? 2 : i < 8 ? 1 : 0,
    status: i === 5 ? 0 : 1,
    createdAt: `2024-08-${String(15 + Math.floor(i / 3)).padStart(2, '0')}T10:00:00`,
  })),
  { id: 17, studentNo: '20240020', name: '马超', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '西安', bio: '', email: '20240020@school.edu.cn', phone: '13800000020', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
  { id: 18, studentNo: '20240021', name: '黄丽', gender: 0, collegeName: '外语学院', majorName: '英语', hometown: '长沙', bio: '', email: '20240021@school.edu.cn', phone: '13800000021', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
  { id: 19, studentNo: '20240022', name: '林涛', gender: 1, collegeName: '理学院', majorName: '物理', hometown: '济南', bio: '', email: '20240022@school.edu.cn', phone: '13800000022', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
  { id: 20, studentNo: '20240023', name: '何雪', gender: 0, collegeName: '电子学院', majorName: '电子信息', hometown: '郑州', bio: '', email: '20240023@school.edu.cn', phone: '13800000023', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
  { id: 21, studentNo: '20240024', name: '罗浩', gender: 1, collegeName: '计算机学院', majorName: '软件工程', hometown: '昆明', bio: '', email: '20240024@school.edu.cn', phone: '13800000024', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
  { id: 22, studentNo: '20240025', name: '谢雨', gender: 0, collegeName: '文学院', majorName: '汉语言文学', hometown: '南昌', bio: '', email: '20240025@school.edu.cn', phone: '13800000025', surveyStatus: 2, matchStatus: 0, status: 1, createdAt: '2024-08-28T10:00:00' },
]

export const mockSchoolConfig = {
  schoolName: '示范大学',
  schoolCode: 'DEMO-UNI',
  logoUrl: '',
  academicYear: '2024-2025',
  semester: '秋季学期',
  contactPhone: '010-88888888',
  contactEmail: 'admin@demo-univ.edu.cn',
}

export const mockColleges = [
  { id: 1, name: '计算机学院', code: 'CS', description: '计算机科学与技术相关专业' },
  { id: 2, name: '电子学院', code: 'EE', description: '电子信息与通信工程相关专业' },
  { id: 3, name: '理学院', code: 'SCI', description: '数学、物理等基础学科' },
  { id: 4, name: '外语学院', code: 'FL', description: '外国语言文学相关专业' },
  { id: 5, name: '文学院', code: 'LIT', description: '中国语言文学与新闻传播相关专业' },
  { id: 6, name: '经管学院', code: 'EM', description: '经济管理相关专业' },
]

export const mockMajors: Record<number, { id: number, name: string; code: string }[]> = {
  1: [{ id: 1, name: '计算机科学与技术', code: 'CS001' }, { id: 2, name: '软件工程', code: 'CS002' }, { id: 3, name: '人工智能', code: 'CS003' }],
  2: [{ id: 4, name: '通信工程', code: 'EE001' }, { id: 5, name: '电子信息', code: 'EE002' }],
  3: [{ id: 6, name: '数学', code: 'SCI001' }, { id: 7, name: '物理', code: 'SCI002' }],
  4: [{ id: 8, name: '英语', code: 'FL001' }, { id: 9, name: '日语', code: 'FL002' }],
  5: [{ id: 10, name: '汉语言文学', code: 'LIT001' }, { id: 11, name: '新闻传播', code: 'LIT002' }],
  6: [{ id: 12, name: '工商管理', code: 'EM001' }, { id: 13, name: '会计学', code: 'EM002' }],
}

export const mockClasses = [
  { id: 1, majorId: 1, name: '计科2401班', grade: 2024 },
  { id: 2, majorId: 1, name: '计科2402班', grade: 2024 },
  { id: 3, majorId: 1, name: '计科2403班', grade: 2024 },
  { id: 4, majorId: 2, name: '软工2401班', grade: 2024 },
  { id: 5, majorId: 2, name: '软工2402班', grade: 2024 },
  { id: 6, majorId: 3, name: '人工智能2401班', grade: 2024 },
  { id: 7, majorId: 4, name: '通信2401班', grade: 2024 },
  { id: 8, majorId: 4, name: '通信2402班', grade: 2024 },
  { id: 9, majorId: 5, name: '电信2401班', grade: 2024 },
  { id: 10, majorId: 6, name: '数学2401班', grade: 2024 },
  { id: 11, majorId: 7, name: '物理2401班', grade: 2024 },
  { id: 12, majorId: 8, name: '英语2401班', grade: 2024 },
  { id: 13, majorId: 8, name: '英语2402班', grade: 2024 },
  { id: 14, majorId: 9, name: '日语2401班', grade: 2024 },
  { id: 15, majorId: 10, name: '汉语言2401班', grade: 2024 },
  { id: 16, majorId: 11, name: '新闻2401班', grade: 2024 },
  { id: 17, majorId: 12, name: '工商2401班', grade: 2024 },
  { id: 18, majorId: 13, name: '会计2401班', grade: 2024 },
]

export const mockDormBuildings = [
  { id: 1, buildingName: '梅园1号楼', buildingCode: 'M1', gender: 1, floors: 6, status: 1 },
  { id: 2, buildingName: '梅园2号楼', buildingCode: 'M2', gender: 1, floors: 6, status: 1 },
  { id: 3, buildingName: '兰园1号楼', buildingCode: 'L1', gender: 0, floors: 6, status: 1 },
  { id: 4, buildingName: '兰园2号楼', buildingCode: 'L2', gender: 0, floors: 6, status: 1 },
  { id: 5, buildingName: '竹园1号楼', buildingCode: 'Z1', gender: 1, floors: 4, status: 1 },
]

export const mockDormRooms = [
  { id: 1, buildingId: 1, roomNumber: 'M1-101', floor: 1, capacity: 4, occupied: 4, roomType: 'NORMAL', status: 1 },
  { id: 2, buildingId: 1, roomNumber: 'M1-102', floor: 1, capacity: 4, occupied: 4, roomType: 'NORMAL', status: 1 },
  { id: 3, buildingId: 1, roomNumber: 'M1-103', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  { id: 4, buildingId: 1, roomNumber: 'M1-104', floor: 1, capacity: 2, occupied: 0, roomType: 'ACCESSIBLE', status: 0 },
  { id: 5, buildingId: 1, roomNumber: 'M1-201', floor: 2, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  { id: 6, buildingId: 1, roomNumber: 'M1-202', floor: 2, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  { id: 7, buildingId: 2, roomNumber: 'M2-101', floor: 1, capacity: 4, occupied: 1, roomType: 'NORMAL', status: 1 },
  { id: 8, buildingId: 2, roomNumber: 'M2-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  { id: 9, buildingId: 3, roomNumber: 'L1-101', floor: 1, capacity: 4, occupied: 4, roomType: 'NORMAL', status: 1 },
  { id: 10, buildingId: 3, roomNumber: 'L1-102', floor: 1, capacity: 4, occupied: 2, roomType: 'NORMAL', status: 1 },
  { id: 11, buildingId: 3, roomNumber: 'L1-103', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  { id: 12, buildingId: 4, roomNumber: 'L2-101', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
]

export const mockAllocations = [
  { id: 1, studentId: 1, studentName: '张伟', roomId: 1, roomNumber: 'M1-101', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 2, studentId: 2, studentName: '李明', roomId: 1, roomNumber: 'M1-101', bedNo: 2, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 3, studentId: 6, studentName: '刘洋', roomId: 1, roomNumber: 'M1-101', bedNo: 3, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 4, studentId: 8, studentName: '周杰', roomId: 1, roomNumber: 'M1-101', bedNo: 4, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 5, studentId: 4, studentName: '赵刚', roomId: 2, roomNumber: 'M1-102', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 6, studentId: 5, studentName: '孙磊', roomId: 2, roomNumber: 'M1-102', bedNo: 2, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 7, studentId: 7, studentName: '陈宇', roomId: 2, roomNumber: 'M1-102', bedNo: 3, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 8, studentId: 17, studentName: '马超', roomId: 2, roomNumber: 'M1-102', bedNo: 4, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-2024-001' },
  { id: 9, studentId: 3, studentName: '王强', roomId: 7, roomNumber: 'M2-101', bedNo: 1, allocationType: 'RANDOM', status: 'PENDING', batchCode: 'BATCH-2024-001' },
  { id: 10, studentId: 9, studentName: '王芳', roomId: 3, roomNumber: 'L1-101', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 11, studentId: 10, studentName: '李娜', roomId: 3, roomNumber: 'L1-101', bedNo: 2, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 12, studentId: 14, studentName: '赵敏', roomId: 3, roomNumber: 'L1-101', bedNo: 3, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 13, studentId: 11, studentName: '张雪', roomId: 3, roomNumber: 'L1-101', bedNo: 4, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-2024-001' },
  { id: 14, studentId: 16, studentName: '吴桐', roomId: 4, roomNumber: 'L1-102', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-2024-001' },
  { id: 15, studentId: 15, studentName: '周雨', roomId: 4, roomNumber: 'L1-102', bedNo: 2, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-2024-001' },
]

export const mockAllObjections = [
  { id: 1, allocationId: 1, studentId: 5, studentName: '孙磊', reason: '希望能和同专业同学住一起', status: 'PENDING', currentHandler: null, reviewComment: '', createdAt: '2024-08-26T09:00:00' },
  { id: 2, allocationId: 3, studentId: 7, studentName: '陈宇', reason: '宿舍楼层太高，希望换到低楼层', status: 'REVIEWING', currentHandler: 100, reviewComment: '已转宿舍管理处审核', createdAt: '2024-08-25T14:00:00' },
  { id: 3, allocationId: 5, studentId: 11, studentName: '张雪', reason: '与舍友作息冲突严重', status: 'RESOLVED', currentHandler: null, reviewComment: '已调整至L1-103', createdAt: '2024-08-24T10:00:00', resolvedAt: '2024-08-25T10:00:00' },
]

export const mockNotifications = [
  { id: 1, studentId: 1, title: '新邀请', content: '李明向你发送了舍友邀请', type: 'INVITE', relatedId: 101, isRead: 0, createdAt: '2024-08-25T12:00:00' },
  { id: 2, studentId: 1, title: '邀请被接受', content: '李明接受了你的舍友邀请，配对成功！', type: 'PAIRING', relatedId: 1, isRead: 0, createdAt: '2024-08-25T12:30:00' },
  { id: 3, studentId: 1, title: '分配结果已发布', content: '你的宿舍分配结果为M1-101，请登录查看并确认', type: 'ALLOCATION', relatedId: 1, isRead: 0, createdAt: '2024-08-27T08:00:00' },
  { id: 4, studentId: 1, title: '问卷完成提醒', content: '你还有未完成的问卷，请在截止日期前完成填写', type: 'SYSTEM', relatedId: 0, isRead: 1, createdAt: '2024-08-24T10:00:00' },
  { id: 5, studentId: 1, title: '配对锁定成功', content: '你和李明的舍友配对已正式锁定', type: 'PAIRING', relatedId: 1, isRead: 1, createdAt: '2024-08-25T13:00:00' },
  { id: 6, studentId: 2, title: '邀请已发送', content: '你向张伟发送了舍友邀请，等待对方回复', type: 'INVITE', relatedId: 101, isRead: 0, createdAt: '2024-08-25T12:00:00' },
  { id: 7, studentId: 2, title: '配对成功', content: '你和张伟的舍友配对已建立', type: 'PAIRING', relatedId: 1, isRead: 0, createdAt: '2024-08-25T12:30:00' },
  { id: 8, studentId: 3, title: '系统通知', content: '考试周即将来临，请合理安排学习时间', type: 'SYSTEM', relatedId: 0, isRead: 0, createdAt: '2024-08-26T10:00:00' },
  { id: 9, studentId: 4, title: '新邀请', content: '王芳向你发送了舍友邀请', type: 'INVITE', relatedId: 102, isRead: 0, createdAt: '2024-08-25T14:00:00' },
  { id: 10, studentId: 5, title: '分配结果已发布', content: '你的宿舍分配结果为M1-102，请登录查看', type: 'ALLOCATION', relatedId: 2, isRead: 0, createdAt: '2024-08-27T08:00:00' },
  { id: 11, studentId: 6, title: '问卷完成提醒', content: '请尽快完成偏好问卷，截止日期为8月31日', type: 'SYSTEM', relatedId: 0, isRead: 0, createdAt: '2024-08-24T10:00:00' },
  { id: 12, studentId: 7, title: '邀请被接受', content: '赵刚接受了你的舍友邀请，配对成功！', type: 'PAIRING', relatedId: 2, isRead: 0, createdAt: '2024-08-25T15:00:00' },
]

export const mockAuditLogs = [
  { id: 1, username: 'admin', role: 'ADMIN', action: 'BATCH_ALLOCATION', targetType: 'ALLOCATION', targetId: 0, detail: '执行批量分配 BATCH-2024-001', ipAddress: '192.168.1.100', createdAt: '2024-08-27T08:00:00' },
  { id: 2, username: 'admin', role: 'ADMIN', action: 'PUBLISH_RESULTS', targetType: 'ALLOCATION', targetId: 0, detail: '发布预分配结果 BATCH-2024-001', ipAddress: '192.168.1.100', createdAt: '2024-08-27T08:05:00' },
  { id: 3, username: 'counselor01', role: 'COUNSELOR', action: 'REVIEW_OBJECTION', targetType: 'OBJECTION', targetId: 2, detail: '审核异议申诉，转宿舍管理处', ipAddress: '192.168.1.101', createdAt: '2024-08-26T10:00:00' },
  { id: 4, username: 'admin', role: 'ADMIN', action: 'TOGGLE_STUDENT', targetType: 'STUDENT', targetId: 5, detail: '禁用学生账号 王强(20240003)', ipAddress: '192.168.1.100', createdAt: '2024-08-26T09:00:00' },
  { id: 5, username: 'admin', role: 'ADMIN', action: 'IMPORT_STUDENTS', targetType: 'STUDENT', targetId: 0, detail: '批量导入5名学生数据', ipAddress: '192.168.1.100', createdAt: '2024-08-25T10:00:00' },
  { id: 6, username: 'admin', role: 'ADMIN', action: 'UPDATE_SURVEY', targetType: 'SURVEY', targetId: 6, detail: '修改题目 HYGIENE_01 选项', ipAddress: '192.168.1.100', createdAt: '2024-08-24T15:00:00' },
  { id: 7, username: 'admin', role: 'ADMIN', action: 'ADD_DORMITORY', targetType: 'DORMITORY', targetId: 5, detail: '添加宿舍楼 竹园1号楼', ipAddress: '192.168.1.100', createdAt: '2024-08-24T10:00:00' },
]

export const mockStatistics = {
  totalStudents: 22,
  completedSurvey: 12,
  paired: 10,
  allocated: 15,
  pendingObjections: 2,
  surveyStatus: { completed: 12, drafting: 4, notStarted: 6 },
  matchStatus: { paired: 10, inviting: 3, waiting: 9 },
  allocationByType: { SELF_SELECT: 7, ALGORITHM: 7, RANDOM: 1, MANUAL: 0 },
  genderDistribution: { male: 12, female: 10 },
  collegeDistribution: [
    { name: '计算机学院', count: 9 },
    { name: '电子学院', count: 5 },
    { name: '理学院', count: 2 },
    { name: '外语学院', count: 3 },
    { name: '文学院', count: 2 },
    { name: '经管学院', count: 1 },
  ],
  dailyRegistrations: [
    { date: '08-20', count: 3 }, { date: '08-21', count: 5 }, { date: '08-22', count: 2 },
    { date: '08-23', count: 6 }, { date: '08-24', count: 4 }, { date: '08-25', count: 3 }, { date: '08-26', count: 2 },
  ],
  dimensionAverages: { SLEEP: 3.2, HYGIENE: 3.5, STUDY: 3.0, HOBBY: 3.8, SOCIAL: 3.3, SPENDING: 2.8, PERSONALITY: 3.1, PSYCHOLOGY: 3.4 },
  leaderScoreDistribution: { high: 5, medium: 12, low: 8 },
}

export function generateInviteCode() {
  return 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

// ========== 学生问卷答案 Mock ==========
// 敏感/隐私维度：PSYCHOLOGY（心理特质/价值观判断）、ATTENTION（注意力检测）、TRAP（验证题）
export const SENSITIVE_DIMENSIONS = ['PSYCHOLOGY', 'ATTENTION', 'TRAP']

const mockStudentAnswersMap: Record<number, Record<number, string>> = {
  // 李明 (ID=2) - 作息规律、安静、卫生好
  2: {
    1:'3',2:'3',3:'2',4:'4',5:'4',84:'1',
    6:'2',7:'1',8:'1',9:'2',10:'1',11:'1',85:'1',87:'A',
    12:'A',13:'A',14:'B',15:'2',16:'1',
    17:'C,F',18:'F',19:'D',20:'B,D',21:'A,E',22:'2',86:'面食,甜品,家常',99:'D',
    25:'3',26:'B',28:'3',29:'A',88:'B',27:'B',
    30:'C',31:'A',32:'2',33:'C',
    34:'C',35:'2',36:'A',37:'1',38:'2',39:'A',40:'1',42:'1',43:'C',
    47:'B',48:'A',56:'计划考研，目标计算机专业研究生',57:'B',
  },
  // 王强 (ID=3) - 抽烟、打呼噜严重、重度游戏玩家
  3: {
    1:'5',2:'5',3:'D',4:'1',5:'1',84:'D',
    6:'D',7:'5',8:'5',9:'4',10:'D',11:'D',85:'5',87:'D',
    12:'D',13:'D',14:'A',15:'4',16:'5',
    17:'A,G',18:'C',19:'A',20:'C',21:'C',22:'E',86:'川菜,烧烤',99:'A',
    25:'4',26:'D',28:'E',29:'E',88:'D',27:'D',
    30:'E',31:'D',32:'1',33:'A',
    34:'A',35:'1',36:'C',37:'D',38:'1',39:'D',40:'E',42:'E',43:'A',
    47:'A',48:'C',56:'暂无明确规划',57:'C',
  },
  // 赵刚 (ID=4) - 开朗、运动型、轻微打呼噜
  4: {
    1:'2',2:'1',3:'A',4:'4',5:'2',84:'B',
    6:'2',7:'3',8:'2',9:'3',10:'B',11:'2',85:'2',87:'B',
    12:'B',13:'B',14:'C',15:'2',16:'2',
    17:'A,B,C',18:'A',19:'C',20:'E',21:'A,B',22:'A',86:'粤菜,火锅,烧烤',99:'C',
    25:'2',26:'B',28:'2',29:'A',88:'A',27:'A',
    30:'C',31:'B',32:'2',33:'B',
    34:'B',35:'2',36:'B',37:'2',38:'1',39:'A',40:'2',42:'3',43:'A',
    47:'B',48:'B',56:'打算考公或进国企',57:'B',
  },
  // 孙磊 (ID=5) - 内向、喜欢独处、阅读
  5: {
    1:'3',2:'2',3:'B',4:'4',5:'3',84:'C',
    6:'1',7:'2',8:'3',9:'3',10:'A',11:'1',85:'1',87:'C',
    12:'B',13:'A',14:'B',15:'E',16:'1',
    17:'G',18:'D',19:'D',20:'A,B',21:'E',22:'E',86:'面食,家常',99:'D',
    25:'5',26:'D',28:'E',29:'D',88:'D',27:'D',
    30:'B',31:'A',32:'C',33:'C',
    34:'C',35:'D',36:'B',37:'2',38:'D',39:'B',40:'3',42:'1',43:'C',
    47:'B',48:'A',56:'计划考研或出国深造',57:'A',
  },
  // 刘洋 (ID=6) - 音乐爱好者、弹吉他
  6: {
    1:'4',2:'3',3:'C',4:'3',5:'3',84:'B',
    6:'2',7:'3',8:'3',9:'3',10:'B',11:'2',85:'2',87:'B',
    12:'C',13:'B',14:'D',15:'2',16:'3',
    17:'F,G',18:'E',19:'C',20:'A,C',21:'A,B,C',22:'3',86:'甜品,日韩',99:'B',
    25:'2',26:'B',28:'3',29:'B',88:'B',27:'C',
    30:'C',31:'B',32:'2',33:'C',
    34:'B',35:'2',36:'B',37:'3',38:'2',39:'B',40:'2',42:'3',43:'B',
    47:'B',48:'A',56:'打算毕业后做音乐相关创业',57:'B',
  },
  // 陈宇 (ID=7) - 洁癖、整洁
  7: {
    1:'3',2:'2',3:'A',4:'5',5:'5',84:'1',
    6:'1',7:'1',8:'1',9:'1',10:'1',11:'1',85:'1',87:'A',
    12:'B',13:'A',14:'B',15:'3',16:'1',
    17:'G',18:'D',19:'D',20:'A,B',21:'E',22:'4',86:'粤菜,家常',99:'D',
    25:'4',26:'D',28:'D',29:'A',88:'C',27:'C',
    30:'B',31:'A',32:'D',33:'C',
    34:'C',35:'D',36:'A',37:'1',38:'C',39:'A',40:'1',42:'1',43:'C',
    47:'B',48:'A',56:'计划考研，目标985院校数学系',57:'B',
  },
  // 张伟 (ID=1) - 默认演示学生，作息规律、喜欢运动、外向
  1: {
    1:'3',2:'2',3:'2',4:'4',5:'3',84:'B',
    6:'2',7:'2',8:'2',9:'3',10:'A',11:'2',85:'2',87:'B',
    12:'B',13:'B',14:'C',15:'2',16:'2',
    17:'A,C',18:'A',19:'C',20:'E',21:'A,B',22:'A',86:'火锅,烧烤,面食',99:'C',
    25:'2',26:'B',28:'2',29:'A',88:'A',27:'A',
    30:'C',31:'B',32:'2',33:'B',
    34:'B',35:'2',36:'B',37:'2',38:'1',39:'A',40:'2',42:'3',43:'A',
    47:'B',48:'A',56:'计划考研计算机专业',57:'B',
  },
}

function getQuestionText(q: any): string {
  if (!q) return ''
  return q.questionText
}

function getAnswerText(q: any, answerValue: string): string {
  if (!q || !q.optionsJson) return answerValue
  try {
    const options = JSON.parse(q.optionsJson)
    if (Array.isArray(options)) {
      const values = answerValue.split(',')
      const matched = values.map(v => {
        const trimmed = v.trim()
        const opt = options.find((o: any) =>
          o.value === v || o.value === trimmed ||
          o.label === v || o.label === trimmed
        )
        return opt ? opt.text : v
      })
      return matched.join('、')
    }
  } catch {}
  return answerValue
}

export function getMockStudentSurvey(studentId: number) {
  const answers = mockStudentAnswersMap[studentId]
  if (!answers) return null
  const sections: Record<string, { key: string; title: string; desc: string; color: string; questions: any[] }> = {}
  const answeredQuestionIds = new Set(Object.keys(answers).map(Number))
  
  mockSurveySections.forEach(sec => {
    const sectionQuestions = sec.questionIds
      .map(qid => mockQuestions.find(q => q.id === qid))
      .filter(q => q && !SENSITIVE_DIMENSIONS.includes(q.dimension) && !q.isAttentionCheck && answeredQuestionIds.has(q.id))
      .map(q => ({
        ...q,
        answerValue: answers[q!.id] || '',
        answerText: getAnswerText(q!, answers[q!.id] || ''),
      }))
    if (sectionQuestions.length > 0) {
      sections[sec.key] = {
        key: sec.key,
        title: sec.title,
        desc: sec.desc,
        color: sec.color,
        questions: sectionQuestions,
      }
    }
  })
  
  const student = mockStudents.find(s => s.id === studentId)
  return {
    studentId,
    studentName: student?.name || '',
    sections: Object.values(sections),
  }
}

// ========== 建议反馈 Mock 数据 ==========
export const mockFeedbacks: { id: number; targetRole: 'DEVELOPER' | 'ADMIN'; title: string; content: string; schoolName: string; submitterName: string; submitterRole: string; status: 'PENDING' | 'REVIEWING' | 'ADOPTED' | 'DECLINED'; createdAt: string; reply?: string; replierRole?: 'DEVELOPER' | 'ADMIN'; problemType?: string; collegeName?: string; majorName?: string; className?: string }[] = [
  {
    id: 1,
    targetRole: 'DEVELOPER',
    title: '希望能增加宿舍楼实景照片功能',
    content: '建议在分配结果页面增加宿舍楼的实景照片，让新生能提前了解宿舍环境，包括房间大小、公共区域等。这样能减少入学后的焦虑感。',
    schoolName: '示范大学',
    submitterName: '张伟',
    submitterRole: 'STUDENT',
    status: 'ADOPTED',
    createdAt: '2024-08-20T14:30:00',
    reply: '感谢建议！我们已在分配结果页面增加了宿舍楼信息展示模块，后续会进一步完善实景照片功能。',
    replierRole: 'DEVELOPER',
  },
  {
    id: 2,
    targetRole: 'ADMIN',
    title: '我们宿舍楼的热水供应时间太短了',
    content: 'M1栋宿舍楼每天晚上10点就停热水了，很多同学晚自习回来来不及洗澡。希望能和后勤沟通，延长热水供应到晚上11点半。',
    schoolName: '示范大学',
    submitterName: '李明',
    submitterRole: 'STUDENT',
    status: 'PENDING',
    createdAt: '2024-08-22T09:15:00',
    problemType: 'FACILITY',
    collegeName: '计算机学院',
    majorName: '计算机科学与技术',
    className: '计科2402班',
  },
  {
    id: 3,
    targetRole: 'DEVELOPER',
    title: '邀请功能希望增加附言模板',
    content: '发送邀请时每次都手动输入比较麻烦，建议提供一些常用附言模板，比如"你好，我们作息很接近，要不要组个队？"之类的，可以方便快速发送。',
    schoolName: '示范大学',
    submitterName: '李明',
    submitterRole: 'STUDENT',
    status: 'PENDING',
    createdAt: '2024-08-25T16:45:00',
  },
  {
    id: 4,
    targetRole: 'ADMIN',
    title: '希望重新审核M1-102房间的分配',
    content: '我们宿舍（M1-102）有一个同学经常半夜打游戏外放，严重影响其他人休息。希望管理员能协调换宿舍或者进行调解。',
    schoolName: '示范大学',
    submitterName: '陈宇',
    submitterRole: 'STUDENT',
    status: 'REVIEWING',
    createdAt: '2024-08-26T10:20:00',
    problemType: 'DORM',
    collegeName: '理学院',
    majorName: '数学',
    className: '数学2401班',
  },
  {
    id: 5,
    targetRole: 'DEVELOPER',
    title: '匹配详情页建议增加聊天功能',
    content: '目前在匹配详情页面只能看到匹配分数，但无法直接与对方交流。建议增加一个简单的留言或聊天功能，让学生可以互相了解后再决定是否组队。',
    schoolName: '示范大学',
    submitterName: '赵刚',
    submitterRole: 'STUDENT',
    status: 'DECLINED',
    createdAt: '2024-08-23T11:00:00',
    reply: '经过评估，实时聊天功能会增加系统复杂度和服务器成本。我们推荐通过现有的邀请机制进行初步沟通，后续可以考虑增加留言板功能。',
    replierRole: 'DEVELOPER',
  },
  {
    id: 6,
    targetRole: 'DEVELOPER',
    title: '数据统计页面需要增加导出报表功能',
    content: '后台数据统计目前只能在线查看，无法导出报表用于学校汇报。建议增加PDF或Excel导出功能，包含分配情况、匹配统计、异议处理等数据汇总。',
    schoolName: '示范大学',
    submitterName: '系统管理员',
    submitterRole: 'ADMIN',
    status: 'ADOPTED',
    createdAt: '2024-08-19T08:00:00',
    reply: '已将该功能加入开发计划，预计下个版本上线报表导出功能。',
    replierRole: 'DEVELOPER',
  },
  {
    id: 7,
    targetRole: 'ADMIN',
    title: '宿舍一楼门禁经常坏，希望尽快维修',
    content: 'M1栋一楼的门禁系统最近频繁故障，学生刷卡经常没反应，安全问题堪忧。请管理员尽快安排维修或更换。',
    schoolName: '示范大学',
    submitterName: '王芳',
    submitterRole: 'STUDENT',
    status: 'ADOPTED',
    createdAt: '2024-08-21T15:00:00',
    reply: '已报修后勤部门，门禁系统将于本周内更换新设备。',
    replierRole: 'ADMIN',
    problemType: 'FACILITY',
    collegeName: '计算机学院',
    majorName: '计算机科学与技术',
    className: '计科2401班',
  },
  {
    id: 8,
    targetRole: 'DEVELOPER',
    title: '手机端适配需要优化，部分按钮被遮挡',
    content: '在iPhone SE等小屏手机上，匹配详情页的部分按钮和进度条被遮挡了。建议做一下移动端响应式适配，确保4.7寸及以上屏幕都能正常显示。',
    schoolName: '测试学院',
    submitterName: '测试生A',
    submitterRole: 'STUDENT',
    status: 'PENDING',
    createdAt: '2024-08-27T08:30:00',
  },
  {
    id: 9,
    targetRole: 'DEVELOPER',
    title: '问卷题目建议增加"是否养宠物"选项',
    content: '目前的问卷没有关于宠物偏好的问题。有些学生有养仓鼠、鱼等小宠物的需求，需要在匹配时考虑这个因素，避免产生矛盾。',
    schoolName: '北京大学',
    submitterName: '北大学生A',
    submitterRole: 'STUDENT',
    status: 'REVIEWING',
    createdAt: '2024-08-25T09:00:00',
  },
  {
    id: 10,
    targetRole: 'DEVELOPER',
    title: '希望能支持跨校互换与转专业场景',
    content: '有些学生入学后会转到其他学院或专业，甚至可能跨校交换。现在的系统没有考虑这种场景，建议增加"转专业后重新匹配"的功能入口。',
    schoolName: '上海大学',
    submitterName: '上大学生B',
    submitterRole: 'STUDENT',
    status: 'PENDING',
    createdAt: '2024-08-26T11:20:00',
  },
  {
    id: 11,
    targetRole: 'ADMIN',
    title: '管理员后台缺少数据导出功能',
    content: '作为管理员，我需要在学期末导出分配报表给校领导。目前后台只能看，不能导出，建议增加Excel/CSV导出按钮。',
    schoolName: '北京大学',
    submitterName: '北大管理员',
    submitterRole: 'ADMIN',
    status: 'PENDING',
    createdAt: '2024-08-24T15:00:00',
  },
  {
    id: 12,
    targetRole: 'DEVELOPER',
    title: '配对流程体验优化建议',
    content: '目前配对需要双方接受邀请后才能锁定，流程比较长。建议增加"快速组队"功能，比如设置一个组队大厅，学生可以设置自己的标签和需求，其他学生可以直接申请加入。',
    schoolName: '上海大学',
    submitterName: '上大学生C',
    submitterRole: 'STUDENT',
    status: 'PENDING',
    createdAt: '2024-08-28T14:00:00',
  },
]

// ============ 用户独立配对/分配数据 ============

const now = new Date()
const fmt = (d: Date) => d.toISOString().replace('Z', '')

export const pairGroups: { pairId: number; members: number[]; status: number; pairingCode: string }[] = [
  { pairId: 1, members: [1, 2], status: 1, pairingCode: 'PAIR-240825-A1' },
  { pairId: 2, members: [4, 5], status: 1, pairingCode: 'PAIR-240825-A2' },
  { pairId: 3, members: [9, 10], status: 1, pairingCode: 'PAIR-240825-B1' },
]

export const roomAssignmentMap: { roomId: number; roomNumber: string; members: { studentId: number; bedNo: number; allocationType: 'SELF_SELECT' | 'ALGORITHM' | 'RANDOM' }[]; status: string }[] = [
  { roomId: 1, roomNumber: 'M1-101', status: 'CONFIRMED', members: [
    { studentId: 1, bedNo: 1, allocationType: 'SELF_SELECT' },
    { studentId: 2, bedNo: 2, allocationType: 'SELF_SELECT' },
    { studentId: 6, bedNo: 3, allocationType: 'ALGORITHM' },
    { studentId: 8, bedNo: 4, allocationType: 'ALGORITHM' },
  ]},
  { roomId: 2, roomNumber: 'M1-102', status: 'CONFIRMED', members: [
    { studentId: 4, bedNo: 1, allocationType: 'SELF_SELECT' },
    { studentId: 5, bedNo: 2, allocationType: 'SELF_SELECT' },
    { studentId: 7, bedNo: 3, allocationType: 'ALGORITHM' },
    { studentId: 17, bedNo: 4, allocationType: 'ALGORITHM' },
  ]},
  { roomId: 9, roomNumber: 'L1-101', status: 'CONFIRMED', members: [
    { studentId: 9, bedNo: 1, allocationType: 'SELF_SELECT' },
    { studentId: 10, bedNo: 2, allocationType: 'SELF_SELECT' },
    { studentId: 14, bedNo: 3, allocationType: 'ALGORITHM' },
    { studentId: 11, bedNo: 4, allocationType: 'ALGORITHM' },
  ]},
]

const nameMap: Record<number, string> = {}
mockStudents.forEach(s => { nameMap[s.id] = s.name })
nameMap[17] = '马超'; nameMap[18] = '黄丽'; nameMap[19] = '林涛'; nameMap[20] = '何雪'; nameMap[21] = '罗浩'; nameMap[22] = '谢雨'

export function getUserPair(userId: number) {
  const group = pairGroups.find(p => p.members.includes(userId))
  if (!group) return null
  return { id: group.pairId, pairingCode: group.pairingCode, groupSize: group.members.length, status: group.status, lockedAt: group.status >= 1 ? fmt(new Date(now.getTime() - 86400000)) : null, createdAt: fmt(new Date(now.getTime() - 172800000)) }
}

export function getUserPairMembers(userId: number) {
  const group = pairGroups.find(p => p.members.includes(userId))
  if (!group) return []
  return group.members.map(id => ({ studentId: id, name: nameMap[id] || `学生${id}`, avatarUrl: '', isInitiator: 0 }))
}

export function getUserAllocation(userId: number) {
  const room = roomAssignmentMap.find(r => r.members.some(m => m.studentId === userId))
  if (!room) return null
  const mySlot = room.members.find(m => m.studentId === userId)!
  return {
    allocationId: room.roomId * 100 + userId,
    roomId: room.roomId,
    roomNumber: room.roomNumber,
    bedNo: mySlot.bedNo,
    allocationType: mySlot.allocationType,
    status: room.status,
    confirmedByStudent: room.status === 'CONFIRMED' ? 1 : 0,
    roommates: room.members
      .filter(m => m.studentId !== userId)
      .map(m => ({ studentId: m.studentId, name: nameMap[m.studentId] || `学生${m.studentId}`, bedNo: m.bedNo, allocationType: m.allocationType })),
  }
}

export function getRoomOccupancy(roomId: number): number {
  const room = roomAssignmentMap.find(r => r.roomId === roomId)
  return room?.members.length || 0
}

export function getRoomCapacity(roomId: number): number {
  const room = mockDormRooms.find(r => r.id === roomId)
  return room?.capacity || 4
}

export function isRoomFull(roomId: number): boolean {
  return getRoomOccupancy(roomId) >= getRoomCapacity(roomId)
}

export function getUserRecommendations(userId: number) {
  const myPair = pairGroups.find(p => p.members.includes(userId))
  const pairedIds = myPair ? myPair.members : [userId]
  return mockRecommendations.filter(r => !pairedIds.includes(r.studentId) && r.studentId !== userId)
}

// ==================== 多学校独立数据 ====================

export const mockAdminAccounts: { id: number; username: string; role: string; schoolCode: string; schoolName: string; status: number }[] = [
  { id: 100, username: '系统管理员', role: 'ADMIN', schoolCode: 'DEMO-UNI', schoolName: '示范大学', status: 1 },
  { id: 101, username: '测试管理员', role: 'ADMIN', schoolCode: 'TEST', schoolName: '测试学院', status: 1 },
  { id: 102, username: '北大管理员', role: 'ADMIN', schoolCode: 'BJ-UNI', schoolName: '北京大学', status: 1 },
  { id: 103, username: '上大管理员', role: 'ADMIN', schoolCode: 'SH-UNI', schoolName: '上海大学', status: 1 },
]

export const schoolStudentsMap: Record<string, any[]> = {
  'DEMO-UNI': [...mockAllStudents],
  'TEST': [
    { id: 101, studentNo: 'T2024001', name: '测试生A', gender: 1, collegeName: '计算机学院', majorName: '软件工程', hometown: '北京', bio: '', email: 't001@test.edu.cn', phone: '13900000001', surveyStatus: 2, matchStatus: 0, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 102, studentNo: 'T2024002', name: '测试生B', gender: 0, collegeName: '电子学院', majorName: '通信工程', hometown: '上海', bio: '', email: 't002@test.edu.cn', phone: '13900000002', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 103, studentNo: 'T2024003', name: '测试生C', gender: 1, collegeName: '理学院', majorName: '数学', hometown: '广州', bio: '', email: 't003@test.edu.cn', phone: '13900000003', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-21T10:00:00' },
    { id: 104, studentNo: 'T2024004', name: '测试生D', gender: 0, collegeName: '外语学院', majorName: '英语', hometown: '深圳', bio: '', email: 't004@test.edu.cn', phone: '13900000004', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-21T10:00:00' },
    { id: 105, studentNo: 'T2024005', name: '测试生E', gender: 1, collegeName: '计算机学院', majorName: '人工智能', hometown: '杭州', bio: '', email: 't005@test.edu.cn', phone: '13900000005', surveyStatus: 2, matchStatus: 2, status: 0, createdAt: '2024-08-22T10:00:00' },
    { id: 106, studentNo: 'T2024006', name: '测试生F', gender: 0, collegeName: '文学院', majorName: '汉语言文学', hometown: '南京', bio: '', email: 't006@test.edu.cn', phone: '13900000006', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-22T10:00:00' },
    { id: 107, studentNo: 'T2024007', name: '测试生G', gender: 1, collegeName: '经管学院', majorName: '工商管理', hometown: '成都', bio: '', email: 't007@test.edu.cn', phone: '13900000007', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-23T10:00:00' },
    { id: 108, studentNo: 'T2024008', name: '测试生H', gender: 0, collegeName: '电子学院', majorName: '电子信息', hometown: '武汉', bio: '', email: 't008@test.edu.cn', phone: '13900000008', surveyStatus: 2, matchStatus: 0, status: 1, createdAt: '2024-08-23T10:00:00' },
  ],
  'BJ-UNI': [
    { id: 201, studentNo: 'B2024001', name: '北大学生A', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '北京', bio: '', email: 'b001@pku.edu.cn', phone: '13810000001', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-18T10:00:00' },
    { id: 202, studentNo: 'B2024002', name: '北大学生B', gender: 0, collegeName: '外语学院', majorName: '英语', hometown: '上海', bio: '', email: 'b002@pku.edu.cn', phone: '13810000002', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-18T10:00:00' },
    { id: 203, studentNo: 'B2024003', name: '北大学生C', gender: 1, collegeName: '理学院', majorName: '物理', hometown: '天津', bio: '', email: 'b003@pku.edu.cn', phone: '13810000003', surveyStatus: 2, matchStatus: 0, status: 1, createdAt: '2024-08-19T10:00:00' },
    { id: 204, studentNo: 'B2024004', name: '北大学生D', gender: 0, collegeName: '文学院', majorName: '新闻传播', hometown: '广州', bio: '', email: 'b004@pku.edu.cn', phone: '13810000004', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-19T10:00:00' },
    { id: 205, studentNo: 'B2024005', name: '北大学生E', gender: 1, collegeName: '电子学院', majorName: '通信工程', hometown: '深圳', bio: '', email: 'b005@pku.edu.cn', phone: '13810000005', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 206, studentNo: 'B2024006', name: '北大学生F', gender: 0, collegeName: '计算机学院', majorName: '人工智能', hometown: '杭州', bio: '', email: 'b006@pku.edu.cn', phone: '13810000006', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 207, studentNo: 'B2024007', name: '北大学生G', gender: 1, collegeName: '经管学院', majorName: '会计学', hometown: '南京', bio: '', email: 'b007@pku.edu.cn', phone: '13810000007', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-21T10:00:00' },
    { id: 208, studentNo: 'B2024008', name: '北大学生H', gender: 0, collegeName: '理学院', majorName: '数学', hometown: '武汉', bio: '', email: 'b008@pku.edu.cn', phone: '13810000008', surveyStatus: 2, matchStatus: 0, status: 0, createdAt: '2024-08-21T10:00:00' },
    { id: 209, studentNo: 'B2024009', name: '北大学生I', gender: 1, collegeName: '计算机学院', majorName: '软件工程', hometown: '成都', bio: '', email: 'b009@pku.edu.cn', phone: '13810000009', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-22T10:00:00' },
  ],
  'SH-UNI': [
    { id: 301, studentNo: 'S2024001', name: '上大学生A', gender: 1, collegeName: '计算机学院', majorName: '计算机科学与技术', hometown: '上海', bio: '', email: 's001@shu.edu.cn', phone: '13710000001', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-19T10:00:00' },
    { id: 302, studentNo: 'S2024002', name: '上大学生B', gender: 0, collegeName: '外语学院', majorName: '日语', hometown: '北京', bio: '', email: 's002@shu.edu.cn', phone: '13710000002', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-19T10:00:00' },
    { id: 303, studentNo: 'S2024003', name: '上大学生C', gender: 1, collegeName: '电子学院', majorName: '电子信息', hometown: '广州', bio: '', email: 's003@shu.edu.cn', phone: '13710000003', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 304, studentNo: 'S2024004', name: '上大学生D', gender: 0, collegeName: '文学院', majorName: '汉语言文学', hometown: '深圳', bio: '', email: 's004@shu.edu.cn', phone: '13710000004', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-20T10:00:00' },
    { id: 305, studentNo: 'S2024005', name: '上大学生E', gender: 1, collegeName: '理学院', majorName: '数学', hometown: '杭州', bio: '', email: 's005@shu.edu.cn', phone: '13710000005', surveyStatus: 2, matchStatus: 0, status: 1, createdAt: '2024-08-21T10:00:00' },
    { id: 306, studentNo: 'S2024006', name: '上大学生F', gender: 0, collegeName: '计算机学院', majorName: '软件工程', hometown: '南京', bio: '', email: 's006@shu.edu.cn', phone: '13710000006', surveyStatus: 1, matchStatus: 0, status: 1, createdAt: '2024-08-21T10:00:00' },
    { id: 307, studentNo: 'S2024007', name: '上大学生G', gender: 1, collegeName: '经管学院', majorName: '工商管理', hometown: '成都', bio: '', email: 's007@shu.edu.cn', phone: '13710000007', surveyStatus: 0, matchStatus: 0, status: 1, createdAt: '2024-08-22T10:00:00' },
    { id: 308, studentNo: 'S2024008', name: '上大学生H', gender: 0, collegeName: '外语学院', majorName: '英语', hometown: '武汉', bio: '', email: 's008@shu.edu.cn', phone: '13710000008', surveyStatus: 2, matchStatus: 2, status: 1, createdAt: '2024-08-22T10:00:00' },
  ],
}

export const schoolBuildingsMap: Record<string, any[]> = {
  'DEMO-UNI': [...mockDormBuildings],
  'TEST': [
    { id: 201, buildingName: '测试A栋', buildingCode: 'TA', gender: 1, floors: 5, status: 1 },
    { id: 202, buildingName: '测试B栋', buildingCode: 'TB', gender: 0, floors: 5, status: 1 },
  ],
  'BJ-UNI': [
    { id: 301, buildingName: '燕园1号楼', buildingCode: 'YY1', gender: 1, floors: 7, status: 1 },
    { id: 302, buildingName: '燕园2号楼', buildingCode: 'YY2', gender: 0, floors: 7, status: 1 },
    { id: 303, buildingName: '燕园3号楼', buildingCode: 'YY3', gender: 1, floors: 5, status: 1 },
  ],
  'SH-UNI': [
    { id: 401, buildingName: '泮池1号楼', buildingCode: 'PC1', gender: 1, floors: 6, status: 1 },
    { id: 402, buildingName: '泮池2号楼', buildingCode: 'PC2', gender: 0, floors: 6, status: 1 },
    { id: 403, buildingName: '泮池3号楼', buildingCode: 'PC3', gender: 1, floors: 5, status: 0 },
  ],
}

export const schoolRoomsMap: Record<string, any[]> = {
  'DEMO-UNI': [...mockDormRooms],
  'TEST': [
    { id: 201, buildingId: 201, roomNumber: 'TA-101', floor: 1, capacity: 4, occupied: 3, roomType: 'NORMAL', status: 1 },
    { id: 202, buildingId: 201, roomNumber: 'TA-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
    { id: 203, buildingId: 202, roomNumber: 'TB-101', floor: 1, capacity: 4, occupied: 2, roomType: 'NORMAL', status: 1 },
    { id: 204, buildingId: 202, roomNumber: 'TB-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  ],
  'BJ-UNI': [
    { id: 301, buildingId: 301, roomNumber: 'YY1-101', floor: 1, capacity: 4, occupied: 4, roomType: 'NORMAL', status: 1 },
    { id: 302, buildingId: 301, roomNumber: 'YY1-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
    { id: 303, buildingId: 302, roomNumber: 'YY2-101', floor: 1, capacity: 4, occupied: 3, roomType: 'NORMAL', status: 1 },
    { id: 304, buildingId: 302, roomNumber: 'YY2-102', floor: 1, capacity: 2, roomType: 'ACCESSIBLE', status: 0 },
    { id: 305, buildingId: 303, roomNumber: 'YY3-101', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  ],
  'SH-UNI': [
    { id: 401, buildingId: 401, roomNumber: 'PC1-101', floor: 1, capacity: 4, occupied: 4, roomType: 'NORMAL', status: 1 },
    { id: 402, buildingId: 401, roomNumber: 'PC1-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
    { id: 403, buildingId: 402, roomNumber: 'PC2-101', floor: 1, capacity: 4, occupied: 3, roomType: 'NORMAL', status: 1 },
    { id: 404, buildingId: 402, roomNumber: 'PC2-102', floor: 1, capacity: 4, occupied: 0, roomType: 'NORMAL', status: 0 },
  ],
}

export const schoolAllocationsMap: Record<string, any[]> = {
  'DEMO-UNI': [...mockAllocations],
  'TEST': [
    { id: 201, studentId: 101, studentName: '测试生A', roomId: 201, roomNumber: 'TA-101', bedNo: 1, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-TEST-001' },
    { id: 202, studentId: 102, studentName: '测试生B', roomId: 203, roomNumber: 'TB-101', bedNo: 1, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-TEST-001' },
    { id: 203, studentId: 104, studentName: '测试生D', roomId: 201, roomNumber: 'TA-101', bedNo: 2, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-TEST-001' },
    { id: 204, studentId: 105, studentName: '测试生E', roomId: 201, roomNumber: 'TA-101', bedNo: 3, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-TEST-001' },
    { id: 205, studentId: 108, studentName: '测试生H', roomId: 203, roomNumber: 'TB-101', bedNo: 2, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-TEST-001' },
  ],
  'BJ-UNI': [
    { id: 301, studentId: 201, studentName: '北大学生A', roomId: 301, roomNumber: 'YY1-101', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-BJ-001' },
    { id: 302, studentId: 202, studentName: '北大学生B', roomId: 303, roomNumber: 'YY2-101', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-BJ-001' },
    { id: 303, studentId: 203, studentName: '北大学生C', roomId: 301, roomNumber: 'YY1-101', bedNo: 2, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-BJ-001' },
    { id: 304, studentId: 206, studentName: '北大学生F', roomId: 301, roomNumber: 'YY1-101', bedNo: 3, allocationType: 'ALGORITHM', status: 'CONFIRMED', batchCode: 'BATCH-BJ-001' },
    { id: 305, studentId: 207, studentName: '北大学生G', roomId: 301, roomNumber: 'YY1-101', bedNo: 4, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-BJ-001' },
    { id: 306, studentId: 204, studentName: '北大学生D', roomId: 303, roomNumber: 'YY2-101', bedNo: 2, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-BJ-001' },
    { id: 307, studentId: 208, studentName: '北大学生H', roomId: 303, roomNumber: 'YY2-101', bedNo: 3, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-BJ-001' },
  ],
  'SH-UNI': [
    { id: 401, studentId: 301, studentName: '上大学生A', roomId: 401, roomNumber: 'PC1-101', bedNo: 1, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-SH-001' },
    { id: 402, studentId: 303, studentName: '上大学生C', roomId: 401, roomNumber: 'PC1-101', bedNo: 2, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-SH-001' },
    { id: 403, studentId: 305, studentName: '上大学生E', roomId: 401, roomNumber: 'PC1-101', bedNo: 3, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-SH-001' },
    { id: 404, studentId: 306, studentName: '上大学生F', roomId: 401, roomNumber: 'PC1-101', bedNo: 4, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-SH-001' },
    { id: 405, studentId: 302, studentName: '上大学生B', roomId: 403, roomNumber: 'PC2-101', bedNo: 1, allocationType: 'ALGORITHM', status: 'PENDING', batchCode: 'BATCH-SH-001' },
    { id: 406, studentId: 308, studentName: '上大学生H', roomId: 403, roomNumber: 'PC2-101', bedNo: 2, allocationType: 'SELF_SELECT', status: 'CONFIRMED', batchCode: 'BATCH-SH-001' },
  ],
}

export const schoolObjectionsMap: Record<string, any[]> = {
  'DEMO-UNI': [...mockAllObjections],
  'TEST': [
    { id: 201, allocationId: 201, studentId: 101, studentName: '测试生A', reason: '希望换到安静的房间', status: 'PENDING', currentHandler: null, reviewComment: '', createdAt: '2024-08-26T09:00:00' },
  ],
  'BJ-UNI': [
    { id: 301, allocationId: 301, studentId: 201, studentName: '北大学生A', reason: '离教学楼太远', status: 'PENDING', currentHandler: null, reviewComment: '', createdAt: '2024-08-25T10:00:00' },
    { id: 302, allocationId: 302, studentId: 202, studentName: '北大学生B', reason: '和舍友作息冲突', status: 'REVIEWING', currentHandler: 102, reviewComment: '正在审核中', createdAt: '2024-08-24T14:00:00' },
  ],
  'SH-UNI': [
    { id: 401, allocationId: 401, studentId: 301, studentName: '上大学生A', reason: '希望调换至其他楼栋', status: 'RESOLVED', currentHandler: null, reviewComment: '已调整至PC2-101', createdAt: '2024-08-23T10:00:00', resolvedAt: '2024-08-24T10:00:00' },
  ],
}

export function getSchoolStatistics(schoolCode: string) {
  const students = schoolStudentsMap[schoolCode] || []
  const allocations = schoolAllocationsMap[schoolCode] || []
  const objections = schoolObjectionsMap[schoolCode] || []
  const total = students.length
  const completed = students.filter(s => s.surveyStatus === 2).length
  const drafting = students.filter(s => s.surveyStatus === 1).length
  const notStarted = students.filter(s => s.surveyStatus === 0).length
  const paired = students.filter(s => s.matchStatus === 2 || s.matchStatus === 3).length
  const allocated = allocations.filter(a => a.status === 'CONFIRMED').length
  const pendingObj = objections.filter(o => o.status === 'PENDING').length
  const male = students.filter(s => s.gender === 1).length
  const female = students.filter(s => s.gender === 0).length

  const allocByType: Record<string, number> = { SELF_SELECT: 0, ALGORITHM: 0, RANDOM: 0, MANUAL: 0 }
  allocations.forEach(a => { allocByType[a.allocationType] = (allocByType[a.allocationType] || 0) + 1 })

  const collegeDist: Record<string, number> = {}
  students.forEach(s => { collegeDist[s.collegeName] = (collegeDist[s.collegeName] || 0) + 1 })
  const collegeDistribution = Object.entries(collegeDist).map(([name, count]) => ({ name, count }))

  return {
    totalStudents: total,
    completedSurvey: completed,
    paired,
    allocated,
    pendingObjections: pendingObj,
    surveyStatus: { completed, drafting, notStarted },
    matchStatus: { paired, inviting: Math.floor(total * 0.15), waiting: total - paired - Math.floor(total * 0.15) },
    allocationByType: allocByType,
    genderDistribution: { male, female },
    collegeDistribution,
    dailyRegistrations: [
      { date: '08-20', count: Math.floor(total * 0.15) }, { date: '08-21', count: Math.floor(total * 0.25) },
      { date: '08-22', count: Math.floor(total * 0.1) }, { date: '08-23', count: Math.floor(total * 0.2) },
      { date: '08-24', count: Math.floor(total * 0.15) }, { date: '08-25', count: Math.floor(total * 0.1) },
      { date: '08-26', count: Math.floor(total * 0.05) },
    ],
    dimensionAverages: { SLEEP: 3.2, HYGIENE: 3.5, STUDY: 3.0, HOBBY: 3.8, SOCIAL: 3.3, SPENDING: 2.8, PERSONALITY: 3.1, PSYCHOLOGY: 3.4 },
    leaderScoreDistribution: { high: Math.floor(total * 0.22), medium: Math.floor(total * 0.55), low: Math.floor(total * 0.23) },
  }
}

export function getPlatformStats() {
  const allCodes = Object.keys(schoolStudentsMap)
  const schoolStats = allCodes.map(code => {
    const stats = getSchoolStatistics(code)
    const school = mockSchools.find(s => s.code === code)
    return { code, name: school?.name || code, shortName: school?.shortName || code, ...stats }
  })
  const totalStudents = schoolStats.reduce((sum, s) => sum + s.totalStudents, 0)
  const completedSurvey = schoolStats.reduce((sum, s) => sum + s.completedSurvey, 0)
  const paired = schoolStats.reduce((sum, s) => sum + s.paired, 0)
  const allocated = schoolStats.reduce((sum, s) => sum + s.allocated, 0)
  const pendingObjections = schoolStats.reduce((sum, s) => sum + s.pendingObjections, 0)
  return { schoolStats, totals: { totalStudents, completedSurvey, paired, allocated, pendingObjections, schoolCount: allCodes.length } }
}
