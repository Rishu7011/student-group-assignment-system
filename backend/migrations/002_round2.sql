-- ============================================================
-- 002_round2.sql
-- Round 2 additive migration — courses, enrollments, group leader
-- Safe to run multiple times (idempotent where possible).
-- ============================================================

-- 1. courses table
CREATE TABLE IF NOT EXISTS courses (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  professor_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. course_enrollments table (students <-> courses)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

-- 3. Add course_id to assignments (nullable — existing rows stay, new rows should supply it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE assignments
      ADD COLUMN course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- 4. Add leader_id to groups (backfill from created_by for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'leader_id'
  ) THEN
    ALTER TABLE groups
      ADD COLUMN leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

    -- Backfill existing groups so they are not broken
    UPDATE groups SET leader_id = created_by WHERE leader_id IS NULL;
  END IF;
END
$$;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course  ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course         ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader              ON groups(leader_id);
