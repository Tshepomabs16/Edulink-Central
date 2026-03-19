
-- Allow tutors to manage content
CREATE POLICY "Tutors can insert content" ON public.content
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'tutor'));

CREATE POLICY "Tutors can update own content" ON public.content
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') AND uploaded_by = auth.uid());

CREATE POLICY "Tutors can delete own content" ON public.content
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') AND uploaded_by = auth.uid());

-- Tutors can view all content and classes
CREATE POLICY "Tutors can view all content" ON public.content
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tutor'));

-- Allow tutors to manage classes
CREATE POLICY "Tutors can insert classes" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'tutor'));

CREATE POLICY "Tutors can update own classes" ON public.classes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') AND instructor_id = auth.uid());

CREATE POLICY "Tutors can delete own classes" ON public.classes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'tutor') AND instructor_id = auth.uid());

CREATE POLICY "Tutors can view all classes" ON public.classes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tutor'));

-- Tutors can view profiles
CREATE POLICY "Tutors can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tutor'));

-- Tutors can upload files
CREATE POLICY "Tutors can upload content files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'tutor'));

-- Update handle_new_user to support tutor role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, grade, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN NEW.raw_user_meta_data->>'grade' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'grade')::SMALLINT 
         ELSE NULL END,
    NEW.raw_user_meta_data->>'school_name'
  );
  
  _role := COALESCE(
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'tutor' THEN 'tutor'::app_role ELSE NULL END,
    'learner'::app_role
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;
