-- =====================================================
-- 新生宿舍舍友自主选择系统 - 数据库初始化脚本
-- =====================================================

CREATE DATABASE IF NOT EXISTS dorm_match DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dorm_match;

-- 学生表
CREATE TABLE IF NOT EXISTS student (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_no      VARCHAR(32)  NOT NULL UNIQUE COMMENT '学号',
    real_name       VARCHAR(50)  NOT NULL COMMENT '真实姓名',
    gender          TINYINT      NOT NULL COMMENT '性别: 0-女 1-男',
    college_id      BIGINT       NOT NULL COMMENT '学院ID',
    major_id        BIGINT       NOT NULL COMMENT '专业ID',
    class_name      VARCHAR(100) COMMENT '班级',
    hometown        VARCHAR(100) COMMENT '生源地',
    phone           VARCHAR(256) COMMENT '手机号(加密存储)',
    email           VARCHAR(256) COMMENT '邮箱(加密存储)',
    avatar_url      VARCHAR(512) COMMENT '头像URL',
    bio             VARCHAR(150) COMMENT '个人简介',
    survey_status   TINYINT DEFAULT 0 COMMENT '问卷状态: 0-未填写 1-填写中 2-已完成',
    survey_completed_at DATETIME COMMENT '问卷完成时间',
    match_status    TINYINT DEFAULT 0 COMMENT '匹配状态: 0-待匹配 1-邀请中 2-已配对 3-已分配',
    password_hash   VARCHAR(256) NOT NULL COMMENT '密码BCrypt哈希',
    status          TINYINT DEFAULT 1 COMMENT '账户状态: 0-禁用 1-正常',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_college (college_id),
    INDEX idx_major (major_id),
    INDEX idx_match_status (match_status),
    INDEX idx_gender_college (gender, college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生表';

-- 问卷题目表
CREATE TABLE IF NOT EXISTS survey_question (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_code   VARCHAR(32)  NOT NULL UNIQUE COMMENT '题目编码',
    dimension       VARCHAR(32)  NOT NULL COMMENT '所属维度',
    sub_dimension   VARCHAR(64)  COMMENT '子维度',
    question_text   VARCHAR(500) NOT NULL COMMENT '题干',
    question_type   VARCHAR(16)  NOT NULL COMMENT '题型: LIKERT5/LIKERT7/SINGLE_CHOICE/MULTI_CHOICE/TEXT',
    options_json    JSON         COMMENT '选项JSON',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    is_required     TINYINT DEFAULT 1 COMMENT '是否必答',
    is_attention_check TINYINT DEFAULT 0 COMMENT '是否注意力检测题',
    status          TINYINT DEFAULT 1 COMMENT '状态: 0-停用 1-启用',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dimension (dimension),
    INDEX idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问卷题目表';

-- 问卷答案表
CREATE TABLE IF NOT EXISTS survey_answer (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id      BIGINT       NOT NULL COMMENT '学生ID',
    question_id     BIGINT       NOT NULL COMMENT '题目ID',
    answer_value    VARCHAR(500) NOT NULL COMMENT '答案值',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_student_question (student_id, question_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问卷答案表';

-- 匹配结果表
CREATE TABLE IF NOT EXISTS match_result (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id      BIGINT       NOT NULL COMMENT '学生ID',
    target_id       BIGINT       NOT NULL COMMENT '匹配目标学生ID',
    total_score     DECIMAL(5,2) NOT NULL COMMENT '综合匹配度(0-100)',
    score_detail    JSON         COMMENT '各维度得分详情JSON',
    is_recommended  TINYINT DEFAULT 0 COMMENT '是否进入推荐列表',
    calculated_at   DATETIME     COMMENT '计算时间',
    UNIQUE KEY uk_pair (student_id, target_id),
    INDEX idx_student_score (student_id, total_score DESC),
    INDEX idx_target_score (target_id, total_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='匹配结果表';

-- 邀请表
CREATE TABLE IF NOT EXISTS invite (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_student_id BIGINT       NOT NULL COMMENT '发送者ID',
    to_student_id   BIGINT       NOT NULL COMMENT '接收者ID',
    message         VARCHAR(200) COMMENT '附言',
    status          TINYINT DEFAULT 0 COMMENT '状态: 0-待处理 1-已接受 2-已拒绝 3-已过期 4-已撤回',
    processed_at    DATETIME     COMMENT '处理时间',
    expires_at      DATETIME     NOT NULL COMMENT '过期时间(48h)',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_to_status (to_student_id, status),
    INDEX idx_from_status (from_student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='室友邀请表';

-- 配对表
CREATE TABLE IF NOT EXISTS pairing (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pairing_code    VARCHAR(36)  NOT NULL UNIQUE COMMENT '配对编号UUID',
    group_size      INT          NOT NULL COMMENT '配对组人数',
    status          TINYINT DEFAULT 0 COMMENT '状态: 0-组建中 1-已锁定 2-已分配',
    locked_at       DATETIME     COMMENT '锁定时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配对表';

-- 配对成员表
CREATE TABLE IF NOT EXISTS pairing_member (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pairing_id      BIGINT       NOT NULL COMMENT '配对ID',
    student_id      BIGINT       NOT NULL COMMENT '学生ID',
    is_initiator    TINYINT DEFAULT 0 COMMENT '是否发起人',
    joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pairing_student (pairing_id, student_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配对成员表';

-- 宿舍楼表
CREATE TABLE IF NOT EXISTS dormitory_building (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    building_name   VARCHAR(100) NOT NULL COMMENT '宿舍楼名称',
    building_code   VARCHAR(32)  NOT NULL UNIQUE COMMENT '楼栋编码',
    gender          TINYINT      NOT NULL COMMENT '入住性别: 0-女 1-男',
    floors          INT          NOT NULL COMMENT '楼层数',
    status          TINYINT DEFAULT 1 COMMENT '状态: 0-停用 1-启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宿舍楼表';

-- 宿舍房间表
CREATE TABLE IF NOT EXISTS dormitory_room (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    building_id     BIGINT       NOT NULL COMMENT '楼栋ID',
    room_number     VARCHAR(20)  NOT NULL COMMENT '房间号',
    floor           INT          NOT NULL COMMENT '楼层',
    capacity        INT          NOT NULL COMMENT '容量(床位数)',
    occupied        INT DEFAULT 0 COMMENT '已占用数',
    room_type       VARCHAR(16) DEFAULT 'NORMAL' COMMENT '类型: NORMAL/ACCESSIBLE',
    status          TINYINT DEFAULT 1 COMMENT '0-空闲 1-部分占用 2-已满 3-维修中',
    UNIQUE KEY uk_room (building_id, room_number),
    INDEX idx_type_status (room_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宿舍房间表';

-- 分配结果表
CREATE TABLE IF NOT EXISTS allocation (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id      BIGINT       NOT NULL UNIQUE COMMENT '学生ID(一人一床位)',
    room_id         BIGINT       NOT NULL COMMENT '房间ID',
    bed_no          TINYINT      COMMENT '床位号(1-N)',
    allocation_type VARCHAR(16)  NOT NULL COMMENT '分配方式: SELF_SELECT/ALGORITHM/RANDOM/MANUAL',
    allocation_batch VARCHAR(32) COMMENT '分配批次号',
    status          VARCHAR(16) DEFAULT 'PENDING' COMMENT 'PENDING/CONFIRMED/OBJECTION/RESOLVED',
    confirmed_by_student TINYINT DEFAULT 0 COMMENT '学生是否确认',
    confirmed_at    DATETIME     COMMENT '确认时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room (room_id),
    INDEX idx_batch (allocation_batch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='宿舍分配结果表';

-- 异议申诉表
CREATE TABLE IF NOT EXISTS objection (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    allocation_id   BIGINT       NOT NULL COMMENT '分配记录ID',
    student_id      BIGINT       NOT NULL COMMENT '申诉学生ID',
    reason          VARCHAR(1000) NOT NULL COMMENT '申诉理由',
    attachment_urls JSON         COMMENT '附件URL列表',
    status          VARCHAR(16) DEFAULT 'PENDING' COMMENT 'PENDING/REVIEWING/RESOLVED/REJECTED',
    current_handler BIGINT       COMMENT '当前处理人ID',
    review_comment  VARCHAR(1000) COMMENT '审核意见',
    resolved_at     DATETIME     COMMENT '解决时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_status (student_id, status),
    INDEX idx_handler (current_handler)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异议申诉表';

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT       COMMENT '操作用户ID',
    username        VARCHAR(50)  NOT NULL COMMENT '用户名',
    role            VARCHAR(32)  NOT NULL COMMENT '角色',
    action          VARCHAR(64)  NOT NULL COMMENT '操作类型',
    target_type     VARCHAR(32)  COMMENT '操作目标类型',
    target_id       BIGINT       COMMENT '操作目标ID',
    detail          JSON         COMMENT '操作详情JSON',
    ip_address      VARCHAR(45)  COMMENT '客户端IP',
    user_agent      VARCHAR(500) COMMENT '客户端UA',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';
