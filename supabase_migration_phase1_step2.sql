-- =============================================
-- MIGRATION Phase 1 - BƯỚC 2: Cập nhật RLS Policies
-- Chạy SAU KHI đã chạy BƯỚC 1 thành công
-- =============================================

-- 3. Cập nhật RLS Policies cho Lessons
-- Xóa các policy cũ
DROP POLICY IF EXISTS "Admins view all lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins update lessons" ON lessons;

-- Tạo policy mới cho phân quyền 4 bậc
CREATE POLICY "Staff view all lessons" ON lessons FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh', 'to_truong')
);

CREATE POLICY "Staff insert lessons" ON lessons FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'to_truong', 'bgh', 'admin')
);

CREATE POLICY "Management update lessons" ON lessons FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

CREATE POLICY "ToTruong update lessons in grade" ON lessons FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'to_truong'
  AND grade_level = (SELECT managed_grade_level FROM profiles WHERE id = auth.uid())
);

-- 4. Cập nhật RLS cho Profiles (cho phép cấp trên sửa cấp dưới)
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

-- 5. Cập nhật Activity Logs cho BGH cũng xem được
DROP POLICY IF EXISTS "Only admins view logs" ON activity_logs;
CREATE POLICY "Only admins view logs" ON activity_logs FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);
