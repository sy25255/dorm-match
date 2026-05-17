-- =======================================================
-- Dorm-Match 数据库表结构 (Supabase PostgreSQL)
-- 在 Supabase SQL Editor 中执行本文件全部内容
-- =======================================================

-- =======================================================
-- 1. 学校表 (schools)
-- =======================================================
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  admin_email VARCHAR(100),
  logo_url TEXT,
  description TEXT,
  contact_phone VARCHAR(30),
  contact_email VARCHAR(100),
  academic_year VARCHAR(20),
  semester VARCHAR(30),
  room_capacity INTEGER DEFAULT 4,
  status SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 2. 用户扩展表 (profiles)
-- =======================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_code VARCHAR(20) REFERENCES schools(code),
  student_no VARCHAR(30),
  name VARCHAR(50) NOT NULL,
  role VARCHAR(10) DEFAULT 'STUDENT',
  gender SMALLINT DEFAULT 1,
  college_name VARCHAR(100),
  major_name VARCHAR(100),
  class_name VARCHAR(100),
  hometown VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  smoking VARCHAR(5) DEFAULT '2',
  snoring VARCHAR(5) DEFAULT '1',
  leader_score INTEGER DEFAULT 0,
  survey_status VARCHAR(20) DEFAULT 'PENDING',
  match_status VARCHAR(20) DEFAULT 'NONE',
  is_valid BOOLEAN DEFAULT true,
  is_test_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 3. 学院表 (colleges)
-- =======================================================
CREATE TABLE IF NOT EXISTS colleges (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 4. 专业表 (majors)
-- =======================================================
CREATE TABLE IF NOT EXISTS majors (
  id SERIAL PRIMARY KEY,
  college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
  school_code VARCHAR(20) REFERENCES schools(code),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 5. 班级表 (classes)
-- =======================================================
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  major_id INTEGER REFERENCES majors(id) ON DELETE CASCADE,
  school_code VARCHAR(20) REFERENCES schools(code),
  name VARCHAR(100) NOT NULL,
  grade INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 6. 问卷题目表 (survey_questions)
-- =======================================================
CREATE TABLE IF NOT EXISTS survey_questions (
  id SERIAL PRIMARY KEY,
  question_code VARCHAR(20) UNIQUE NOT NULL,
  dimension VARCHAR(30) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL,
  options_json JSONB,
  sort_order INTEGER DEFAULT 0,
  is_required SMALLINT DEFAULT 1,
  is_attention_check SMALLINT DEFAULT 0,
  status SMALLINT DEFAULT 1,
  trap_answer VARCHAR(10),
  trap_section VARCHAR(30),
  placeholder TEXT,
  supplement_placeholder TEXT,
  dropdown_placeholder TEXT,
  has_supplement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 7. 问卷分节配置 (survey_sections)
-- =======================================================
CREATE TABLE IF NOT EXISTS survey_sections (
  id SERIAL PRIMARY KEY,
  section_key VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(10),
  question_ids INTEGER[] NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 8. 问卷答案表 (survey_answers)
-- =======================================================
CREATE TABLE IF NOT EXISTS survey_answers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES survey_questions(id),
  answer_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- =======================================================
-- 9. 邀请表 (invites)
-- =======================================================
CREATE TABLE IF NOT EXISTS invites (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  school_code VARCHAR(20) REFERENCES schools(code),
  message TEXT,
  status SMALLINT DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 10. 配对组表 (pair_groups)
-- =======================================================
CREATE TABLE IF NOT EXISTS pair_groups (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code),
  pairing_code VARCHAR(20) UNIQUE NOT NULL,
  status SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ
);

-- =======================================================
-- 11. 配对成员表 (pair_members)
-- =======================================================
CREATE TABLE IF NOT EXISTS pair_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES pair_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_initiator SMALLINT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =======================================================
-- 12. 宿舍楼表 (dormitory_buildings)
-- =======================================================
CREATE TABLE IF NOT EXISTS dormitory_buildings (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  gender SMALLINT DEFAULT 1,
  floors INTEGER DEFAULT 6,
  status SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 13. 宿舍房间表 (dormitory_rooms)
-- =======================================================
CREATE TABLE IF NOT EXISTS dormitory_rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES dormitory_buildings(id) ON DELETE CASCADE,
  school_code VARCHAR(20) REFERENCES schools(code),
  room_number VARCHAR(20) NOT NULL,
  floor INTEGER DEFAULT 1,
  capacity INTEGER DEFAULT 4,
  occupied INTEGER DEFAULT 0,
  room_type VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(20) DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 14. 分配结果表 (allocations)
-- =======================================================
CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES dormitory_rooms(id),
  room_number VARCHAR(20),
  bed_no INTEGER,
  allocation_type VARCHAR(20) DEFAULT 'ALGORITHM',
  status VARCHAR(20) DEFAULT 'PENDING',
  batch_code VARCHAR(50),
  confirmed_by_student SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 15. 异议表 (allocation_objections)
-- =======================================================
CREATE TABLE IF NOT EXISTS allocation_objections (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code),
  allocation_id INTEGER REFERENCES allocations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  handler_id UUID REFERENCES profiles(id),
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =======================================================
-- 16. 通知表 (notifications)
-- =======================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(30) DEFAULT 'SYSTEM',
  related_id INTEGER,
  is_read SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 17. 审计日志表 (audit_logs)
-- =======================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code),
  user_id UUID REFERENCES profiles(id),
  username VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  detail TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 18. 邀请码表 (invite_codes)
-- =======================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id SERIAL PRIMARY KEY,
  school_code VARCHAR(20) REFERENCES schools(code),
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  used_by UUID REFERENCES profiles(id),
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 索引
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_colleges_school ON colleges(school_code);
CREATE INDEX IF NOT EXISTS idx_majors_college ON majors(college_id);
CREATE INDEX IF NOT EXISTS idx_classes_major ON classes(major_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_user ON survey_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_from ON invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_invites_to ON invites(to_user_id);
CREATE INDEX IF NOT EXISTS idx_invites_school ON invites(school_code);
CREATE INDEX IF NOT EXISTS idx_pair_members_user ON pair_members(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_user ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_school ON allocations(school_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON audit_logs(school_code);

-- =======================================================
-- RLS (Row Level Security) 策略
-- =======================================================

-- profiles: 同校学生互相可见，自己可编辑
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_same_school" ON profiles
  FOR SELECT USING (
    school_code = (SELECT p.school_code FROM profiles p WHERE p.id = auth.uid())
    OR role = 'DEVELOPER'
  );
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- invitations: 发送者和接收者可见
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_related" ON invites
  FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );
CREATE POLICY "invites_insert_own" ON invites
  FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "invites_update_related" ON invites
  FOR UPDATE USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- pair_groups
ALTER TABLE pair_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pair_groups_select_same_school" ON pair_groups
  FOR SELECT USING (
    school_code = (SELECT p.school_code FROM profiles p WHERE p.id = auth.uid())
  );

-- pair_members
ALTER TABLE pair_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pair_members_select_same_school" ON pair_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pair_groups pg
      WHERE pg.id = pair_members.group_id
      AND pg.school_code = (SELECT p.school_code FROM profiles p WHERE p.id = auth.uid())
    )
  );

-- allocations
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allocations_select_same_school" ON allocations
  FOR SELECT USING (
    school_code = (SELECT p.school_code FROM profiles p WHERE p.id = auth.uid())
  );

-- allocation_objections
ALTER TABLE allocation_objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objections_select_own_or_admin" ON allocation_objections
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'DEVELOPER'))
  );

-- notifications: 仅接收者可见
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- survey_answers: 仅自己
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_answers_select_own" ON survey_answers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "survey_answers_insert_own" ON survey_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "survey_answers_update_own" ON survey_answers
  FOR UPDATE USING (user_id = auth.uid());

-- 公共读表 (所有人可读，无需 RLS)
-- survey_questions, survey_sections, colleges, majors, classes,
-- schools, dormitory_buildings, dormitory_rooms, invite_codes
-- 这些表的 SELECT 不做 RLS 限制，数据对所有已认证用户公开

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select_all" ON schools FOR SELECT USING (true);

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colleges_select_all" ON colleges FOR SELECT USING (true);

ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "majors_select_all" ON majors FOR SELECT USING (true);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_select_all" ON classes FOR SELECT USING (true);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_all" ON survey_questions FOR SELECT USING (true);

ALTER TABLE survey_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_select_all" ON survey_sections FOR SELECT USING (true);

ALTER TABLE dormitory_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buildings_select_all" ON dormitory_buildings FOR SELECT USING (true);

ALTER TABLE dormitory_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select_all" ON dormitory_rooms FOR SELECT USING (true);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_codes_select_all" ON invite_codes FOR SELECT USING (true);

-- =======================================================
-- 演示种子数据
-- =======================================================
INSERT INTO schools (code, name, short_name, description, status) VALUES
  ('DEMO-UNI', '示范大学', '示范大', '示范大学是一所综合性大学', 1),
  ('TEST', '测试学院', '测试', '技术测试用学校', 1);

INSERT INTO colleges (school_code, name, code, description, sort_order) VALUES
  ('DEMO-UNI', '计算机学院', 'CS', '计算机科学与技术相关专业', 1),
  ('DEMO-UNI', '电子学院', 'EE', '电子信息与通信工程相关专业', 2),
  ('DEMO-UNI', '理学院', 'SCI', '数学、物理等基础学科', 3),
  ('DEMO-UNI', '外语学院', 'FL', '外国语言文学相关专业', 4),
  ('DEMO-UNI', '文学院', 'LIT', '中国语言文学与新闻传播相关专业', 5),
  ('DEMO-UNI', '经管学院', 'EM', '经济管理相关专业', 6);

INSERT INTO majors (college_id, school_code, name, code, sort_order) VALUES
  (1, 'DEMO-UNI', '计算机科学与技术', 'CS001', 1),
  (1, 'DEMO-UNI', '软件工程', 'CS002', 2),
  (1, 'DEMO-UNI', '人工智能', 'CS003', 3),
  (2, 'DEMO-UNI', '通信工程', 'EE001', 1),
  (2, 'DEMO-UNI', '电子信息', 'EE002', 2),
  (3, 'DEMO-UNI', '数学', 'SCI001', 1),
  (3, 'DEMO-UNI', '物理', 'SCI002', 2),
  (4, 'DEMO-UNI', '英语', 'FL001', 1),
  (4, 'DEMO-UNI', '日语', 'FL002', 2),
  (5, 'DEMO-UNI', '汉语言文学', 'LIT001', 1),
  (5, 'DEMO-UNI', '新闻传播', 'LIT002', 2),
  (6, 'DEMO-UNI', '工商管理', 'EM001', 1),
  (6, 'DEMO-UNI', '会计学', 'EM002', 2);

INSERT INTO classes (major_id, school_code, name, grade, sort_order) VALUES
  (1, 'DEMO-UNI', '计科2401班', 2024, 1),
  (1, 'DEMO-UNI', '计科2402班', 2024, 2),
  (2, 'DEMO-UNI', '软工2401班', 2024, 1),
  (2, 'DEMO-UNI', '软工2402班', 2024, 2),
  (3, 'DEMO-UNI', '人工智能2401班', 2024, 1),
  (4, 'DEMO-UNI', '通信2401班', 2024, 1),
  (5, 'DEMO-UNI', '电信2401班', 2024, 1),
  (6, 'DEMO-UNI', '数学2401班', 2024, 1),
  (7, 'DEMO-UNI', '物理2401班', 2024, 1),
  (8, 'DEMO-UNI', '英语2401班', 2024, 1),
  (9, 'DEMO-UNI', '日语2401班', 2024, 1),
  (10, 'DEMO-UNI', '汉语言2401班', 2024, 1),
  (11, 'DEMO-UNI', '新闻2401班', 2024, 1),
  (12, 'DEMO-UNI', '工商2401班', 2024, 1),
  (13, 'DEMO-UNI', '会计2401班', 2024, 1);

INSERT INTO dormitory_buildings (school_code, name, code, gender, floors, status) VALUES
  ('DEMO-UNI', '梅园1号楼', 'M1', 1, 6, 1),
  ('DEMO-UNI', '梅园2号楼', 'M2', 1, 6, 1),
  ('DEMO-UNI', '兰园1号楼', 'L1', 0, 6, 1),
  ('DEMO-UNI', '兰园2号楼', 'L2', 0, 6, 1),
  ('DEMO-UNI', '竹园1号楼', 'Z1', 1, 4, 1);

INSERT INTO dormitory_rooms (building_id, school_code, room_number, floor, capacity, occupied, room_type, status) VALUES
  (1, 'DEMO-UNI', 'M1-101', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (1, 'DEMO-UNI', 'M1-102', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (1, 'DEMO-UNI', 'M1-103', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (1, 'DEMO-UNI', 'M1-104', 1, 2, 0, 'ACCESSIBLE', 'AVAILABLE'),
  (1, 'DEMO-UNI', 'M1-201', 2, 4, 0, 'NORMAL', 'AVAILABLE'),
  (1, 'DEMO-UNI', 'M1-202', 2, 4, 0, 'NORMAL', 'AVAILABLE'),
  (2, 'DEMO-UNI', 'M2-101', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (2, 'DEMO-UNI', 'M2-102', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (3, 'DEMO-UNI', 'L1-101', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (3, 'DEMO-UNI', 'L1-102', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (3, 'DEMO-UNI', 'L1-103', 1, 4, 0, 'NORMAL', 'AVAILABLE'),
  (4, 'DEMO-UNI', 'L2-101', 1, 4, 0, 'NORMAL', 'AVAILABLE');

-- 插入问卷题目 (从 mockQuestions 迁移)
-- 仅插入核心题目，完整题目可在管理后台后续添加
INSERT INTO survey_questions (question_code, dimension, question_text, question_type, options_json, sort_order, is_required, is_attention_check, status) VALUES
  ('SLEEP_01', 'SLEEP', '您通常的起床时间是？', 'SINGLE_CHOICE', '[{"label":"A","value":"1","text":"6:00之前"},{"label":"B","value":"2","text":"6:00-7:00"},{"label":"C","value":"3","text":"7:00-8:00"},{"label":"D","value":"4","text":"8:00-9:00"},{"label":"E","value":"5","text":"9:00之后"}]', 1, 1, 0, 1),
  ('SLEEP_02', 'SLEEP', '您通常的就寝时间是？', 'SINGLE_CHOICE', '[{"label":"A","value":"1","text":"22:00之前"},{"label":"B","value":"2","text":"22:00-23:00"},{"label":"C","value":"3","text":"23:00-24:00"},{"label":"D","value":"4","text":"24:00-1:00"},{"label":"E","value":"5","text":"1:00之后"}]', 2, 1, 0, 1),
  ('SLEEP_03', 'SLEEP', '您是否有午休习惯？', 'SINGLE_CHOICE', '[{"label":"A","value":"1","text":"每天必须午休"},{"label":"B","value":"2","text":"经常午休"},{"label":"C","value":"3","text":"偶尔午休"},{"label":"D","value":"4","text":"从不午休"}]', 3, 1, 0, 1),
  ('SLEEP_04', 'SLEEP', '您的作息规律程度如何？', 'LIKERT5', '[{"label":"1","value":"1","text":"非常不规律"},{"label":"2","value":"2","text":"比较不规律"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较规律"},{"label":"5","value":"5","text":"非常规律"}]', 4, 1, 0, 1),
  ('SLEEP_05', 'SLEEP', '您对睡眠环境的安静程度要求？', 'LIKERT5', '[{"label":"1","value":"1","text":"完全无所谓"},{"label":"2","value":"2","text":"不太在意"},{"label":"3","value":"3","text":"一般"},{"label":"4","value":"4","text":"比较在意"},{"label":"5","value":"5","text":"非常在意，必须安静"}]', 5, 1, 0, 1);

-- 插入问卷分节
INSERT INTO survey_sections (section_key, title, description, color, question_ids, sort_order) VALUES
  ('sleep', '生活作息', '了解你的睡眠和作息习惯', '#722ed1', ARRAY[1,2,3,4,5], 1),
  ('basic', '基础信息采集', '生活习惯与健康信息', '#1890ff', ARRAY[]::integer[], 0);

-- =======================================================
-- 触发器: 新用户注册后自动创建 profile
-- =======================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();