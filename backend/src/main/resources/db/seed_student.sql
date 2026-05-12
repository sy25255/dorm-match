-- =====================================================
-- 种子数据: 测试学生账号 (密码均为 123456 的BCrypt哈希)
-- BCrypt($2a$10$...) for "123456"
-- =====================================================

INSERT INTO student (student_no, real_name, gender, college_id, major_id, class_name, hometown, bio, survey_status, survey_completed_at, match_status, password_hash, status) VALUES
('20240001', '张伟', 1, 1, 1, '计算机2401', '北京', '热爱编程和篮球，希望找到志同道合的舍友', 2, '2024-08-20 10:00:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240002', '李明', 1, 1, 1, '计算机2401', '上海', '喜欢安静的学习环境，作息规律', 2, '2024-08-20 10:05:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240003', '王强', 1, 1, 2, '软件2401', '广州', '重度游戏玩家，希望能找到一起开黑的舍友', 2, '2024-08-20 10:10:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240004', '赵刚', 1, 2, 3, '通信2401', '深圳', '喜欢运动和户外，性格开朗', 2, '2024-08-20 10:15:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240005', '孙磊', 1, 2, 3, '通信2401', '杭州', '性格内向，喜欢独处和阅读', 2, '2024-08-20 10:20:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240006', '刘洋', 1, 1, 4, '人工智能2401', '成都', '音乐爱好者，会弹吉他，希望舍友能接受偶尔的乐器声', 2, '2024-08-20 10:25:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240007', '陈宇', 1, 3, 5, '数学2401', '武汉', '喜欢整洁，希望舍友也有良好的卫生习惯', 2, '2024-08-20 10:30:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240008', '周杰', 1, 1, 1, '计算机2401', '南京', '夜猫子，喜欢深夜学习，希望舍友不介意', 2, '2024-08-20 10:35:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),

('20240011', '王芳', 0, 1, 1, '计算机2401', '北京', '喜欢整洁安静的环境，作息规律', 2, '2024-08-20 10:40:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240012', '李娜', 0, 1, 2, '软件2401', '上海', '性格开朗，喜欢社交和集体活动', 2, '2024-08-20 10:45:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240013', '张雪', 0, 2, 3, '通信2401', '广州', '喜欢追剧和看综艺，希望能找到一起追剧的舍友', 2, '2024-08-20 10:50:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240014', '刘婷', 0, 1, 4, '人工智能2401', '杭州', '文艺青年，喜欢阅读和写作，希望有安静的学习氛围', 2, '2024-08-20 10:55:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240015', '陈静', 0, 3, 5, '数学2401', '武汉', '性格比较内向，喜欢独处，但也愿意和舍友友好相处', 2, '2024-08-20 11:00:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240016', '赵敏', 0, 4, 6, '英语2401', '深圳', '热爱运动健身，每天跑步，希望舍友能接受早起', 2, '2024-08-20 11:05:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240017', '周雨', 0, 1, 1, '计算机2401', '成都', '喜欢游戏和动漫，希望能找到二次元同好', 2, '2024-08-20 11:10:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1),
('20240018', '吴桐', 0, 2, 3, '通信2401', '南京', '注重生活品质，喜欢布置宿舍，希望舍友也爱干净', 2, '2024-08-20 11:15:00', 0, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1);
