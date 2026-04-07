-- =============================================
-- EduKids Database Schema (Updated: Phase 1)
-- =============================================

-- 1. Create custom types for enum
-- 5 vai trò: admin (Super Admin), bgh (Ban Giám hiệu), to_truong (Tổ trưởng), teacher (Giáo viên), parent (Phụ huynh)
CREATE TYPE user_role AS ENUM ('admin', 'bgh', 'to_truong', 'teacher', 'parent');
CREATE TYPE lesson_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT,
  dob DATE,
  phone TEXT,
  role user_role DEFAULT 'parent',
  managed_grade_level TEXT, -- Dành cho Tổ trưởng: khối lớp phụ trách (Khối Nhà trẻ, Khối Mầm, Khối Chồi, Khối Lá)
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subjects table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.5 Classes table
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Lessons table
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status lesson_status DEFAULT 'pending',
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. School Settings table (singleton)
CREATE TABLE school_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  theme_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- 7. Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Activity Log table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- School Settings
CREATE POLICY "School settings viewable by everyone" ON school_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to update settings" ON school_settings FOR ALL USING (auth.role() = 'authenticated');

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Cho phép cấp trên sửa hồ sơ cấp dưới
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

-- Subjects
CREATE POLICY "Subjects viewable by everyone" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow authenticated to modify subjects" ON subjects FOR ALL USING (auth.role() = 'authenticated');

-- Classes
CREATE POLICY "Classes viewable by everyone" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated admin manage classes" ON classes FOR ALL USING (auth.role() = 'authenticated');

-- Lessons
CREATE POLICY "Approved lessons viewable by everyone" ON lessons FOR SELECT USING (status = 'approved');
CREATE POLICY "Teachers view own pending lessons" ON lessons FOR SELECT USING (teacher_id = auth.uid());
-- Admin, BGH, Tổ trưởng đều có quyền xem tất cả bài giảng
CREATE POLICY "Staff view all lessons" ON lessons FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh', 'to_truong')
);
-- Giáo viên, Tổ trưởng, BGH, Admin đều có thể upload bài giảng
CREATE POLICY "Staff insert lessons" ON lessons FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'to_truong', 'bgh', 'admin')
);
-- Admin và BGH có thể cập nhật/phê duyệt bài giảng
CREATE POLICY "Management update lessons" ON lessons FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);
-- Tổ trưởng có thể duyệt bài trong khối mình
CREATE POLICY "ToTruong update lessons in grade" ON lessons FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'to_truong'
  AND grade_level = (SELECT managed_grade_level FROM profiles WHERE id = auth.uid())
);

-- Bookmarks
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Activity Logs
CREATE POLICY "Only admins view logs" ON activity_logs FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'bgh')
);

-- 11. Functions & Triggers
-- Handle auto user profile creation after sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'parent');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
