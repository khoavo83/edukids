-- =============================================
-- MIGRATION Phase 3: Hồ sơ Phụ huynh/Học sinh, Sự kiện, Gallery, CMS
-- =============================================

-- 1. Bảng Students (Hồ sơ Bé)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  dob DATE,
  blood_type TEXT,
  allergy_notes TEXT,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Authorized Pickups (Người đón ủy quyền)
CREATE TABLE IF NOT EXISTS authorized_pickups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quản lý Sự kiện (Events)
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Thư viện Ảnh (Gallery)
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'chung',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CMS Trang chủ (School Settings mở rộng)
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS banner_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS contact_address TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- 6. RLS Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Admins/BGH/Teacher có thể xem toàn bộ Học sinh
CREATE POLICY "Staff view any student" ON students FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh', 'to_truong', 'teacher')
);
-- Phụ huynh chỉ xem con mình
CREATE POLICY "Parents view own student" ON students FOR SELECT USING (
  parent_id = auth.uid()
);
-- Admin, BGH có thể thêm sửa xóa học sinh
CREATE POLICY "Admins manage students" ON students USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

-- Policy cho authorized_pickups (tương tự students)
CREATE POLICY "Staff view pickups" ON authorized_pickups FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh', 'to_truong', 'teacher')
);
CREATE POLICY "Parents view own pickups" ON authorized_pickups FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
);
CREATE POLICY "Admins manage pickups" ON authorized_pickups USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

-- Policy cho Events & Gallery (Public view, Admin manage)
CREATE POLICY "Anyone views events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON events USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);
CREATE POLICY "Anyone views gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Admins manage gallery" ON gallery USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);
