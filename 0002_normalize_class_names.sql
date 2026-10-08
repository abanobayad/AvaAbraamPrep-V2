-- Normalize colloquial class names to the formal spelling used across the UI.
-- Run with: npx wrangler d1 execute attendance-db --remote --file=0002_normalize_class_names.sql
UPDATE "Student" SET "studentClass" = 'ثانية إعدادي' WHERE "studentClass" = 'تانية إعدادي';
UPDATE "Student" SET "studentClass" = 'ثالثة إعدادي' WHERE "studentClass" = 'تالتة إعدادي';
