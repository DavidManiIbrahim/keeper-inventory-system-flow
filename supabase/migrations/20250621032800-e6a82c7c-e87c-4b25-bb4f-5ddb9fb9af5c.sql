
-- Update the profiles table to set default role as 'employee'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'employee'::user_role;

-- Update the get_user_role function to return 'employee' as default instead of 'admin'
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM profiles WHERE id = user_id), 'employee'::user_role);
$$;

-- Update existing profiles that have 'admin' role to 'employee' (optional - only if you want to change existing users)
-- Uncomment the line below if you want to update existing admin users to employee
-- UPDATE public.profiles SET role = 'employee'::user_role WHERE role = 'admin'::user_role;
