-- DryRun database schema
-- Run with: npm run db:init (executes this file against DATABASE_URL)
-- Safe to re-run: drops and recreates all tables (dev-friendly, not for production data).

DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS scorecards CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS interviewer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'interviewer', 'admin')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interviewer_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  department TEXT,
  years_experience INTEGER,
  bio TEXT,
  tags TEXT[],
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'auto_verified', 'admin_verified', 'rejected')),
  avg_rating NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0
);

-- start_time/end_time are always stored in UTC; convert to local only at display time.
CREATE TABLE slots (
  id SERIAL PRIMARY KEY,
  interviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'booked', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'expired', 'completed')),
  meeting_link TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE scorecards (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  communication INTEGER CHECK (communication BETWEEN 1 AND 10),
  problem_solving INTEGER CHECK (problem_solving BETWEEN 1 AND 10),
  code_quality INTEGER CHECK (code_quality BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE verification_requests (
  id SERIAL PRIMARY KEY,
  interviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_slots_interviewer ON slots(interviewer_id);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_verification_status ON verification_requests(status);
