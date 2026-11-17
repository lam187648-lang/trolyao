-- Migration 003: thêm các cột ban mà API đăng nhập/phiên đang sử dụng.
-- Bắt buộc áp dụng trên mọi môi trường, bao gồm production, sau khi đã backup.
-- Chỉ chạy qua migration runner: trong thư mục server/, chạy `npm run db:migrate`.
-- Runner quản lý transaction và là nơi duy nhất ghi nhận vào schema_migrations;
-- file SQL này không được INSERT marker.
-- `IF NOT EXISTS` giúp chạy lại an toàn nhưng không thay thế marker của runner.

-- Thêm cột ban_reason nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Thêm cột ban_started_at nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_started_at TIMESTAMPTZ;

-- Thêm cột ban_expires_at nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ;

-- status vẫn dùng 'locked':
--   'locked' + ban_expires_at IS NOT NULL = khóa tạm thời
--   'locked' + ban_expires_at IS NULL     = khóa vĩnh viễn
