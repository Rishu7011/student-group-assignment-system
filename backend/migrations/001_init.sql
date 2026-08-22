-- ============================================================
-- 001_init.sql
-- Student, Group & Assignment Management System — initial schema
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(10)   NOT NULL CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  created_by  INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Group members (N-N: users <-> groups)
CREATE TABLE IF NOT EXISTS group_members (
  id         SERIAL PRIMARY KEY,
  group_id   INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id                 SERIAL PRIMARY KEY,
  title              VARCHAR(255)  NOT NULL,
  description        TEXT,
  due_date           DATE          NOT NULL,
  onedrive_link      TEXT          NOT NULL,
  created_by         INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to_type   VARCHAR(10)   NOT NULL CHECK (assigned_to_type IN ('all', 'group')),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Assignment ↔ Group targeting (only used when assigned_to_type = 'group')
CREATE TABLE IF NOT EXISTS assignment_groups (
  id             SERIAL  PRIMARY KEY,
  assignment_id  INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id       INTEGER NOT NULL REFERENCES groups(id)      ON DELETE CASCADE,
  UNIQUE (assignment_id, group_id)
);

-- Submissions (one per assignment + group pair)
CREATE TABLE IF NOT EXISTS submissions (
  id               SERIAL PRIMARY KEY,
  assignment_id    INTEGER      NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id         INTEGER      NOT NULL REFERENCES groups(id)      ON DELETE CASCADE,
  status           VARCHAR(25)  NOT NULL
                     CHECK (status IN ('pending', 'pending_confirmation', 'confirmed'))
                     DEFAULT 'pending',
  confirmed_by     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, group_id)
);
