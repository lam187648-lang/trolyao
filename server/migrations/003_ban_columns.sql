-- Migration 003: Thêm cột ban vào bảng users
-- Chạy migration này sau khi migration 001 đã được áp dụng
-- KHÔNG chạy trên production database

-- Thêm cột ban_reason nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Thêm cột ban_started_at nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_started_at TIMESTAMPTZ;

-- Thêm cột ban_expires_at nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ;

-- Cập nhật CHECK constraint cho status để hỗ trợ 'banned' (thực ra dùng 'locked')
-- Status 'locked' + ban_expires_at = tạm khóa theo thời gian
-- Status 'locked' + ban_expires_at IS NULL = khóa vĩnh viễn

-- Ghi nhận migration
INSERT INTO schema_migrations (migration_id) VALUES ('003_ban_columns') ON CONFLICT DO NOTHING;
