-- 管理员 RLS 策略补充 (在 Supabase SQL Editor 中执行)
-- 为所有需要管理员 CRUD 操作的表添加写权限

CREATE POLICY "admin_all_colleges" ON colleges FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_majors" ON majors FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_classes" ON classes FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_survey_questions" ON survey_questions FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_survey_sections" ON survey_sections FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_schools" ON schools FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_dormitory_buildings" ON dormitory_buildings FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_dormitory_rooms" ON dormitory_rooms FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_pair_groups" ON pair_groups FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_pair_members" ON pair_members FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_allocations" ON allocations FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_invite_codes" ON invite_codes FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_audit_logs" ON audit_logs FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_notifications" ON notifications FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "admin_all_objections" ON allocation_objections FOR ALL USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'DEVELOPER'))
);
CREATE POLICY "invites_all_same_school" ON invites FOR ALL USING (
  school_code = (SELECT p.school_code FROM profiles p WHERE p.id = auth.uid())
);