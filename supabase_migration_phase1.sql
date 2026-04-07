-- =============================================
-- MIGRATION Phase 1 - BƯỚC 1: Thêm enum values + cột mới
-- Chạy RIÊNG bước này trước, rồi mới chạy BƯỚC 2
-- =============================================

-- 1. Thêm 2 vai trò mới vào enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bgh' AFTER 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'to_truong' AFTER 'bgh';

-- 2. Bổ sung cột mới cho bảng profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_grade_level TEXT;
