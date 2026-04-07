-- =============================================
-- MIGRATION Phase 2 - BƯỚC 1: Thêm cột Hồ sơ Nhân sự + Bảng Thực đơn
-- =============================================

-- 1. Bổ sung cột Hồ sơ Nhân sự vào profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temporary_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cccd_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cccd_issued_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cccd_issued_place TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_insurance_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_insurance_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;

-- 2. Thêm cột soft delete cho lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Tạo bảng Thực đơn (menus)
CREATE TABLE IF NOT EXISTS menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 2 AND 7),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('sang', 'trua', 'xe', 'phu')),
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho truy vấn thực đơn theo tuần
CREATE INDEX IF NOT EXISTS idx_menus_week ON menus(week_start_date, day_of_week, meal_type);

-- RLS cho menus
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Mọi người đều xem được thực đơn (công khai)
CREATE POLICY "Anyone can view menus" ON menus FOR SELECT USING (true);
