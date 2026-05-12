-- =====================================================
-- 种子数据: 偏好调查问卷题目 & 测试数据
-- =====================================================

-- 维度1: 生活作息 (SLEEP) - 5题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('SLEEP_01', 'SLEEP', '起床时间', '您通常的起床时间是？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"6:00之前"},{"label":"B","value":"2","text":"6:00-7:00"},{"label":"C","value":"3","text":"7:00-8:00"},{"label":"D","value":"4","text":"8:00-9:00"},{"label":"E","value":"5","text":"9:00之后"}]', 1, 1, 0, 1),

('SLEEP_02', 'SLEEP', '就寝时间', '您通常的就寝时间是？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"22:00之前"},{"label":"B","value":"2","text":"22:00-23:00"},{"label":"C","value":"3","text":"23:00-24:00"},{"label":"D","value":"4","text":"24:00-1:00"},{"label":"E","value":"5","text":"1:00之后"}]', 2, 1, 0, 1),

('SLEEP_03', 'SLEEP', '午休习惯', '您是否有午休习惯？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"每天必须午休"},{"label":"B","value":"2","text":"经常午休"},{"label":"C","value":"3","text":"偶尔午休"},{"label":"D","value":"4","text":"从不午休"}]', 3, 1, 0, 1),

('SLEEP_04', 'SLEEP', '作息规律性', '您的作息规律程度如何？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常不规律"},{"label":"2","value":"2","text":"比较不规律"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较规律"},{"label":"5","value":"5","text":"非常规律"}]', 4, 1, 0, 1),

('SLEEP_05', 'SLEEP', '睡眠敏感度', '您对睡眠环境的安静程度要求？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"完全无所谓"},{"label":"2","value":"2","text":"不太在意"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较在意"},{"label":"5","value":"5","text":"非常在意，必须安静"}]', 5, 1, 0, 1);

-- 维度2: 卫生习惯 (HYGIENE) - 6题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('HYGIENE_01', 'HYGIENE', '个人卫生', '您个人洗澡频率？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"每天多次"},{"label":"B","value":"2","text":"每天一次"},{"label":"C","value":"3","text":"2-3天一次"},{"label":"D","value":"4","text":"3天以上一次"}]', 10, 1, 0, 1),

('HYGIENE_02', 'HYGIENE', '物品整理', '您的个人物品整理习惯？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常整洁有序"},{"label":"2","value":"2","text":"比较整洁"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较随意"},{"label":"5","value":"5","text":"非常随性自由"}]', 11, 1, 0, 1),

('HYGIENE_03', 'HYGIENE', '公共区域', '您是否愿意参与宿舍公共区域（卫生间、阳台）的打扫？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常愿意，会主动打扫"},{"label":"2","value":"2","text":"愿意参与轮值"},{"label":"3","value":"3","text":"被提醒后会做"},{"label":"4","value":"4","text":"不太想做"},{"label":"5","value":"5","text":"完全不想做"}]', 12, 1, 0, 1),

('HYGIENE_04', 'HYGIENE', '容忍度', '对舍友卫生习惯的容忍程度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"零容忍，必须和我一样干净"},{"label":"2","value":"2","text":"希望比较干净"},{"label":"3","value":"3","text":"基本整洁就行"},{"label":"4","value":"4","text":"比较宽容"},{"label":"5","value":"5","text":"完全不在乎"}]', 13, 1, 0, 1),

('HYGIENE_05', 'HYGIENE', '垃圾处理', '您多久会清理一次宿舍的个人垃圾桶？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"每天清理"},{"label":"B","value":"2","text":"2-3天清理一次"},{"label":"C","value":"3","text":"满了再清理"},{"label":"D","value":"4","text":"被提醒才会清理"}]', 14, 1, 0, 1),

('HYGIENE_06', 'HYGIENE', '通风习惯', '您是否习惯经常开窗通风？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"每天必须通风"},{"label":"2","value":"2","text":"经常通风"},{"label":"3","value":"3","text":"偶尔通风"},{"label":"4","value":"4","text":"很少开窗"},{"label":"5","value":"5","text":"几乎不通风"}]', 15, 1, 0, 1);

-- 维度3: 学习习惯 (STUDY) - 5题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('STUDY_01', 'STUDY', '学习时间', '您偏好的主要学习时间段？', 'MULTI_CHOICE',
 '[{"label":"A","value":"1","text":"上午"},{"label":"B","value":"2","text":"下午"},{"label":"C","value":"3","text":"傍晚"},{"label":"D","value":"4","text":"深夜"}]', 20, 1, 0, 1),

('STUDY_02', 'STUDY', '学习环境', '您偏好什么样的学习环境？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"绝对安静"},{"label":"B","value":"2","text":"安静但可接受轻微声响"},{"label":"C","value":"3","text":"有点背景音也可以"},{"label":"D","value":"4","text":"无所谓什么环境"}]', 21, 1, 0, 1),

('STUDY_03', 'STUDY', '学习地点', '您更倾向于在哪里学习？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"主要在宿舍"},{"label":"B","value":"2","text":"主要在图书馆/自习室"},{"label":"C","value":"3","text":"各一半"},{"label":"D","value":"4","text":"看心情"}]', 22, 1, 0, 1),

('STUDY_04', 'STUDY', '小组学习', '您对小组学习/讨论的态度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常喜欢，主动组织"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"可有可无"},{"label":"4","value":"4","text":"不太喜欢"},{"label":"5","value":"5","text":"非常排斥"}]', 23, 1, 0, 1),

('STUDY_05', 'STUDY', '学习专注度', '您学习时对周围交谈声的容忍度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"完全不能接受"},{"label":"2","value":"2","text":"小声交谈可以"},{"label":"3","value":"3","text":"一般交谈可以"},{"label":"4","value":"4","text":"比较吵闹也可以"},{"label":"5","value":"5","text":"完全不受影响"}]', 24, 1, 0, 1);

-- 维度4: 兴趣爱好 (HOBBY) - 8题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('HOBBY_01', 'HOBBY', '运动', '您喜欢的运动类型？（多选）', 'MULTI_CHOICE',
 '[{"label":"A","value":"篮球","text":"篮球"},{"label":"B","value":"足球","text":"足球"},{"label":"C","value":"跑步","text":"跑步/健身"},{"label":"D","value":"羽毛球","text":"羽毛球/乒乓球"},{"label":"E","value":"游泳","text":"游泳"},{"label":"F","value":"瑜伽","text":"瑜伽/拉伸"},{"label":"G","value":"不运动","text":"不喜欢运动"}]', 30, 1, 0, 1),

('HOBBY_02', 'HOBBY', '音乐', '您喜欢的音乐类型？（多选）', 'MULTI_CHOICE',
 '[{"label":"A","value":"流行","text":"流行"},{"label":"B","value":"摇滚","text":"摇滚/金属"},{"label":"C","value":"说唱","text":"说唱/嘻哈"},{"label":"D","value":"古典","text":"古典/纯音乐"},{"label":"E","value":"民谣","text":"民谣/独立"},{"label":"F","value":"电子","text":"电子/EDM"},{"label":"G","value":"不听","text":"很少听音乐"}]', 31, 1, 0, 1),

('HOBBY_03', 'HOBBY', '游戏', '您的游戏习惯？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"重度玩家（每天3h以上）"},{"label":"B","value":"2","text":"中度玩家（每天1-3h）"},{"label":"C","value":"3","text":"休闲玩家（偶尔玩玩）"},{"label":"D","value":"4","text":"完全不玩游戏"}]', 32, 1, 0, 1),

('HOBBY_04', 'HOBBY', '阅读', '您的课外阅读偏好？（多选）', 'MULTI_CHOICE',
 '[{"label":"A","value":"文学","text":"文学/小说"},{"label":"B","value":"社科","text":"社科/历史/哲学"},{"label":"C","value":"科技","text":"科技/科普"},{"label":"D","value":"漫画","text":"漫画/轻小说"},{"label":"E","value":"自我提升","text":"自我提升/成功学"},{"label":"F","value":"不读","text":"基本不课外阅读"}]', 33, 1, 0, 1),

('HOBBY_05', 'HOBBY', '影视', '您喜欢的影视类型？（多选）', 'MULTI_CHOICE',
 '[{"label":"A","value":"电影","text":"电影"},{"label":"B","value":"电视剧","text":"电视剧"},{"label":"C","value":"动漫","text":"动漫/番剧"},{"label":"D","value":"综艺","text":"综艺"},{"label":"E","value":"纪录片","text":"纪录片"},{"label":"F","value":"不看","text":"很少看影视"}]', 34, 1, 0, 1),

('HOBBY_06', 'HOBBY', '户外', '您对户外活动的喜爱程度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常热衷，经常组织"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"不太喜欢"},{"label":"5","value":"5","text":"完全不喜欢"}]', 35, 1, 0, 1),

('HOBBY_07', 'LIFESTYLE', '音量', '您在宿舍播放音乐/视频时习惯的音量？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"只用耳机"},{"label":"B","value":"2","text":"很小声外放"},{"label":"C","value":"3","text":"正常外放"},{"label":"D","value":"4","text":"比较大声"}]', 36, 1, 0, 1),

('HOBBY_08', 'LIFESTYLE', '宠物', '您对宿舍养小型宠物（仓鼠、鱼等）的态度？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"喜欢并支持"},{"label":"B","value":"2","text":"无所谓"},{"label":"C","value":"3","text":"不太接受"},{"label":"D","value":"4","text":"坚决反对"}]', 37, 1, 0, 1);

-- 维度5: 社交偏好 (SOCIAL) - 4题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('SOCIAL_01', 'SOCIAL', '社交频率', '您期望在大学期间的社交频率？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常频繁，积极参加各种活动"},{"label":"2","value":"2","text":"比较频繁"},{"label":"3","value":"3","text":"适中"},{"label":"4","value":"4","text":"较少社交"},{"label":"5","value":"5","text":"很少社交，喜欢独处"}]', 40, 1, 0, 1),

('SOCIAL_02', 'SOCIAL', '宿舍社交', '您对舍友在宿舍接待朋友的态度？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"非常欢迎，我自己也会"},{"label":"B","value":"2","text":"提前告知就可以"},{"label":"C","value":"3","text":"偶尔可以"},{"label":"D","value":"4","text":"最好不要"}]', 41, 1, 0, 1),

('SOCIAL_04', 'SOCIAL', '集体活动', '对宿舍集体活动（一起吃饭、出游等）的态度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常期待，最好经常有"},{"label":"2","value":"2","text":"比较喜欢"},{"label":"3","value":"3","text":"顺其自然"},{"label":"4","value":"4","text":"偶尔即可"},{"label":"5","value":"5","text":"不太感兴趣"}]', 43, 1, 0, 1),

('SOCIAL_05', 'SOCIAL', '沟通方式', '遇到矛盾时您倾向于？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"直接当面沟通"},{"label":"B","value":"2","text":"私下委婉沟通"},{"label":"C","value":"3","text":"通过第三方传达"},{"label":"D","value":"4","text":"默默忍受"},{"label":"E","value":"5","text":"不理对方"}]', 44, 1, 0, 1);

-- 维度6: 消费观念 (SPENDING) - 4题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('SPEND_01', 'SPENDING', '月消费', '您预估的月生活费水平？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"1000元以下"},{"label":"B","value":"2","text":"1000-1500元"},{"label":"C","value":"3","text":"1500-2000元"},{"label":"D","value":"4","text":"2000-3000元"},{"label":"E","value":"5","text":"3000元以上"}]', 50, 1, 0, 1),

('SPEND_02', 'SPENDING', 'AA制', '对舍友一起消费时的AA制偏好？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"严格AA"},{"label":"B","value":"2","text":"大致AA即可"},{"label":"C","value":"3","text":"轮流请客"},{"label":"D","value":"4","text":"不计较"}]', 51, 1, 0, 1),

('SPEND_03', 'SPENDING', '共享物品', '对舍友分享共用物品（如洗衣液、零食）的态度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"很大方，乐于分享"},{"label":"2","value":"2","text":"比较愿意分享"},{"label":"3","value":"3","text":"各用各的"},{"label":"4","value":"4","text":"不太喜欢共享"},{"label":"5","value":"5","text":"完全不想共享"}]', 52, 1, 0, 1),

('SPEND_04', 'LIFESTYLE', '空调使用', '夏季空调温度偏好？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"22度以下（很冷）"},{"label":"B","value":"2","text":"22-24度"},{"label":"C","value":"3","text":"24-26度"},{"label":"D","value":"4","text":"26度以上或不开"},{"label":"E","value":"5","text":"不开空调"}]', 53, 1, 0, 1);

-- 维度7: 性格特征 (PERSONALITY) - 10题 (Big Five简化版)
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('PERS_01', 'PERSONALITY', '外向性', '在聚会中，您通常会？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"成为焦点，和很多人交谈"},{"label":"B","value":"2","text":"和几个熟人聊天"},{"label":"C","value":"3","text":"安静坐在角落"},{"label":"D","value":"4","text":"找借口不去"}]', 60, 1, 0, 1),

('PERS_02', 'PERSONALITY', '外向性', '结识新朋友时您的感受？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常兴奋，主动社交"},{"label":"2","value":"2","text":"比较愿意"},{"label":"3","value":"3","text":"需要一点时间"},{"label":"4","value":"4","text":"比较紧张"},{"label":"5","value":"5","text":"非常抗拒"}]', 61, 1, 0, 1),

('SOCIAL_03', 'PERSONALITY', '独处需求', '您每天需要多长时间的独处/安静时间？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"几乎不需要"},{"label":"B","value":"2","text":"1小时以下"},{"label":"C","value":"3","text":"1-3小时"},{"label":"D","value":"4","text":"3小时以上"}]', 42, 1, 0, 1),

('PERS_03', 'PERSONALITY', '情绪稳定性', '面对压力时您的表现？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"冷静应对，几乎不受影响"},{"label":"B","value":"2","text":"有些焦虑但能自我调节"},{"label":"C","value":"3","text":"比较焦虑，需要倾诉"},{"label":"D","value":"4","text":"容易崩溃，情绪波动大"}]', 62, 1, 0, 1),

('PERS_04', 'PERSONALITY', '情绪稳定性', '您的情绪起伏程度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常稳定"},{"label":"2","value":"2","text":"比较稳定"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较起伏"},{"label":"5","value":"5","text":"大起大落"}]', 63, 1, 0, 1),

('PERS_05', 'PERSONALITY', '开放性', '对新事物的接受程度？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常喜欢尝试新事物"},{"label":"2","value":"2","text":"比较开放"},{"label":"3","value":"3","text":"看情况"},{"label":"4","value":"4","text":"比较保守"},{"label":"5","value":"5","text":"非常不喜欢变化"}]', 64, 1, 0, 1),

('PERS_06', 'PERSONALITY', '宜人性', '当舍友行为让您不舒服时，您会？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"委婉体谅地提醒"},{"label":"B","value":"2","text":"直接但友善地说"},{"label":"C","value":"3","text":"忍很久才爆发"},{"label":"D","value":"4","text":"直接怼回去"}]', 65, 1, 0, 1),

('PERS_07', 'PERSONALITY', '宜人性', '您是否愿意为团队和谐做出让步？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常愿意，和谐最重要"},{"label":"2","value":"2","text":"比较愿意"},{"label":"3","value":"3","text":"视情况而定"},{"label":"4","value":"4","text":"不太愿意"},{"label":"5","value":"5","text":"坚持自我，不妥协"}]', 66, 1, 0, 1),

('PERS_08', 'PERSONALITY', '责任心', '在小组作业中您的角色？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"主动组织，确保完成"},{"label":"B","value":"2","text":"认真完成自己部分"},{"label":"C","value":"3","text":"按要求完成"},{"label":"D","value":"4","text":"拖到最后一刻"}]', 67, 1, 0, 1),

('PERS_09', 'PERSONALITY', '责任心', '您倾向于提前计划还是即兴行事？', 'LIKERT5',
 '[{"label":"1","value":"1","text":"凡事必须提前计划"},{"label":"2","value":"2","text":"比较喜欢有计划"},{"label":"3","value":"3","text":"看情况"},{"label":"4","value":"4","text":"比较即兴"},{"label":"5","value":"5","text":"完全随性"}]', 68, 1, 0, 1),

('PERS_10', 'PERSONALITY', '幽默感', '您对宿舍氛围的期望？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"轻松幽默，经常玩笑"},{"label":"B","value":"2","text":"友好温馨"},{"label":"C","value":"3","text":"安静有序"},{"label":"D","value":"4","text":"互不打扰"}]', 69, 1, 0, 1);

-- 注意力检测题 (共3道)
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('ATTN_01', 'ATTENTION', '注意力检测', '这是一道注意力检测题，请选择选项C（一般）。', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常不同意"},{"label":"2","value":"2","text":"不同意"},{"label":"3","value":"3","text":"一般（请选此项）"},{"label":"4","value":"4","text":"同意"},{"label":"5","value":"5","text":"非常同意"}]', 100, 0, 1, 1),

('ATTN_02', 'ATTENTION', '注意力检测', '为了确认您在认真作答，本题请选择第二个选项。', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"选项一"},{"label":"B","value":"2","text":"选项二（请选此项）"},{"label":"C","value":"3","text":"选项三"}]', 101, 0, 1, 1),

('ATTN_03', 'ATTENTION', '注意力检测', '本题请选"同意"以表示您在认真作答。', 'LIKERT5',
 '[{"label":"1","value":"1","text":"非常不同意"},{"label":"2","value":"2","text":"不同意"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"同意（请选此项）"},{"label":"5","value":"5","text":"非常同意"}]', 102, 0, 1, 1);

-- 维度8: 特殊需求 (SPECIAL) - 3题
INSERT INTO survey_question (question_code, dimension, sub_dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
('SPEC_01', 'SPECIAL', '健康需求', '您是否有需要舍友知道的过敏史或健康状况？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"没有"},{"label":"B","value":"2","text":"有轻微过敏（花粉/灰尘等）"},{"label":"C","value":"3","text":"有食物过敏"},{"label":"D","value":"4","text":"有其他需要特别说明的健康状况"}]', 110, 1, 0, 1),

('SPEC_02', 'SPECIAL', '宗教饮食', '您是否有宗教相关的饮食或生活习惯需要舍友理解？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"没有"},{"label":"B","value":"2","text":"有饮食方面的特殊要求"},{"label":"C","value":"3","text":"有作息相关的宗教习惯"},{"label":"D","value":"4","text":"有其他需要说明的习惯"}]', 111, 0, 0, 1),

('SPEC_03', 'SPECIAL', '无障碍', '您是否有肢体相关特殊住宿需求？', 'SINGLE_CHOICE',
 '[{"label":"A","value":"1","text":"没有"},{"label":"B","value":"2","text":"需要低楼层"},{"label":"C","value":"3","text":"需要无障碍设施"},{"label":"D","value":"4","text":"有其他特殊住宿需求"}]', 112, 0, 0, 1);
