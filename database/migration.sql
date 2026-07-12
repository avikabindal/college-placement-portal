-- Migration script to add support for active/inactive companies, linkedin profiles, registration years, and application resume snapshots.

-- 1. Add is_active column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Add linkedin_url and registration_year to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_year INTEGER;

-- 3. Add resume_url snapshot column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url TEXT;