-- =============================================
-- MIGRATION Phase 2 - BƯỚC 2: RLS Policies cho menus
-- Chạy SAU bước 1
-- =============================================

-- Chỉ Admin/BGH được thêm/sửa/xóa Thực đơn
CREATE POLICY "Management can insert menus" ON menus FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

CREATE POLICY "Management can update menus" ON menus FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

CREATE POLICY "Management can delete menus" ON menus FOR DELETE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);
