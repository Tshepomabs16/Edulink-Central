
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'learner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  grade SMALLINT CHECK (grade >= 7 AND grade <= 12),
  school_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  grade_level SMALLINT NOT NULL CHECK (grade_level >= 7 AND grade_level <= 12),
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create content table
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('notes', 'video', 'past_paper')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  grade_level SMALLINT NOT NULL CHECK (grade_level >= 7 AND grade_level <= 12),
  file_url TEXT,
  video_url TEXT,
  description TEXT,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  year INTEGER,
  term SMALLINT CHECK (term >= 1 AND term <= 4)
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  grade_level SMALLINT NOT NULL CHECK (grade_level >= 7 AND grade_level <= 12),
  date_time TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  recording_url TEXT,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user grade
CREATE OR REPLACE FUNCTION public.get_user_grade(_user_id UUID)
RETURNS SMALLINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT grade FROM public.profiles WHERE id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Subjects policies (all authenticated can read)
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Content policies (grade-filtered for learners)
CREATE POLICY "Learners can view grade content" ON public.content
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR grade_level = public.get_user_grade(auth.uid())
  );

CREATE POLICY "Admins can manage content" ON public.content
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content" ON public.content
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content" ON public.content
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Classes policies (grade-filtered for learners)
CREATE POLICY "Learners can view grade classes" ON public.classes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR grade_level = public.get_user_grade(auth.uid())
  );

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update classes" ON public.classes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete classes" ON public.classes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, grade, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    (NEW.raw_user_meta_data->>'grade')::SMALLINT,
    NEW.raw_user_meta_data->>'school_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default subjects for all grades
INSERT INTO public.subjects (subject_name, grade_level, description, icon_name) VALUES
  ('Mathematics', 7, 'Numbers, algebra, geometry and data handling', 'calculator'),
  ('English', 7, 'Language, literature and composition', 'book-open'),
  ('Science', 7, 'Physical and natural sciences', 'flask-conical'),
  ('History', 7, 'World and local history', 'landmark'),
  ('Geography', 7, 'Physical and human geography', 'globe'),
  ('Life Skills', 7, 'Personal development and life orientation', 'heart'),
  ('Mathematics', 8, 'Numbers, algebra, geometry and data handling', 'calculator'),
  ('English', 8, 'Language, literature and composition', 'book-open'),
  ('Science', 8, 'Physical and natural sciences', 'flask-conical'),
  ('History', 8, 'World and local history', 'landmark'),
  ('Geography', 8, 'Physical and human geography', 'globe'),
  ('Life Skills', 8, 'Personal development and life orientation', 'heart'),
  ('Mathematics', 9, 'Numbers, algebra, geometry and statistics', 'calculator'),
  ('English', 9, 'Language, literature and composition', 'book-open'),
  ('Physical Science', 9, 'Physics and chemistry fundamentals', 'flask-conical'),
  ('Biology', 9, 'Life sciences and biology', 'microscope'),
  ('History', 9, 'World and local history', 'landmark'),
  ('Geography', 9, 'Physical and human geography', 'globe'),
  ('Mathematics', 10, 'Algebra, trigonometry and calculus intro', 'calculator'),
  ('English', 10, 'Advanced language and literature', 'book-open'),
  ('Physical Science', 10, 'Physics and chemistry', 'flask-conical'),
  ('Biology', 10, 'Life sciences', 'microscope'),
  ('Accounting', 10, 'Financial accounting basics', 'file-spreadsheet'),
  ('Business Studies', 10, 'Introduction to business', 'briefcase'),
  ('Mathematics', 11, 'Advanced algebra, trigonometry and calculus', 'calculator'),
  ('English', 11, 'Literature analysis and academic writing', 'book-open'),
  ('Physical Science', 11, 'Advanced physics and chemistry', 'flask-conical'),
  ('Biology', 11, 'Advanced life sciences', 'microscope'),
  ('Accounting', 11, 'Financial statements and analysis', 'file-spreadsheet'),
  ('Business Studies', 11, 'Business operations and management', 'briefcase'),
  ('Mathematics', 12, 'Calculus, statistics and probability', 'calculator'),
  ('English', 12, 'Advanced literature and critical writing', 'book-open'),
  ('Physical Science', 12, 'Exam preparation physics and chemistry', 'flask-conical'),
  ('Biology', 12, 'Exam preparation life sciences', 'microscope'),
  ('Accounting', 12, 'Advanced financial accounting', 'file-spreadsheet'),
  ('Business Studies', 12, 'Business strategy and entrepreneurship', 'briefcase');

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);

-- Storage policies
CREATE POLICY "Authenticated users can view content files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'content-files');

CREATE POLICY "Admins can upload content files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));
