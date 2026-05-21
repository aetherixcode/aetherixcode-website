-- ============================================================
-- AETHERIX — Supabase SQL Schema (COMPLETE)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. ENUMS
CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- 2. TABLES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  difficulty course_difficulty NOT NULL DEFAULT 'beginner',
  teacher_name TEXT NOT NULL,
  prerequisites TEXT,
  total_lectures INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecture_number INT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  notes_url TEXT,
  dpp_url TEXT,
  dpp_solution_url TEXT,
  quiz_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, lecture_number)
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE lecture_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lecture_id)
);

CREATE TABLE video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  watched_seconds INT NOT NULL DEFAULT 0,
  total_duration INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lecture_id)
);

-- 3. INDEXES
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_lectures_course ON lectures(course_id);
CREATE INDEX idx_lectures_number ON lectures(course_id, lecture_number);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_lecture_progress_user ON lecture_progress(user_id);
CREATE INDEX idx_lecture_progress_lecture ON lecture_progress(lecture_id);
CREATE INDEX idx_video_progress_user ON video_progress(user_id);
CREATE INDEX idx_video_progress_lecture ON video_progress(lecture_id);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_lectures_updated_at BEFORE UPDATE ON lectures FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_video_progress_updated_at BEFORE UPDATE ON video_progress FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 5. AUTO-CREATE PROFILE ON SIGNUP (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. AUTO-UPDATE total_lectures
CREATE OR REPLACE FUNCTION update_course_lecture_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses SET total_lectures = total_lectures + 1 WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses SET total_lectures = total_lectures - 1 WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lecture_count_change AFTER INSERT OR DELETE ON lectures FOR EACH ROW EXECUTE FUNCTION update_course_lecture_count();

-- 7. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can do all on courses" ON courses FOR ALL USING (
  auth.jwt()->>'email' IN ('aetherixcode@gmail.com','itxxmananrewri@gmail.com')
);

-- Lectures
CREATE POLICY "View lectures of published courses" ON lectures FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = lectures.course_id AND courses.is_published = TRUE)
);
CREATE POLICY "Admins can do all on lectures" ON lectures FOR ALL USING (
  auth.jwt()->>'email' IN ('aetherixcode@gmail.com','itxxmananrewri@gmail.com')
);

-- Enrollments
CREATE POLICY "View own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enroll self" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unenroll self" ON enrollments FOR DELETE USING (auth.uid() = user_id);

-- Lecture progress
CREATE POLICY "View own progress" ON lecture_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own progress" ON lecture_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own progress" ON lecture_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own progress" ON lecture_progress FOR DELETE USING (auth.uid() = user_id);

-- Video progress
CREATE POLICY "Manage own video progress" ON video_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. HELPER: progress percentage
CREATE OR REPLACE FUNCTION get_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_total INT; v_completed INT;
BEGIN
  SELECT total_lectures INTO v_total FROM courses WHERE id = p_course_id;
  IF v_total = 0 THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO v_completed FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id WHERE lp.user_id = p_user_id AND l.course_id = p_course_id;
  RETURN ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
