
-- Drop the existing overly permissive policy for products
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

-- Create new policies that restrict access based on user roles
-- Policy for SELECT - all authenticated users can view products
CREATE POLICY "All authenticated users can view products" 
ON products FOR SELECT 
TO authenticated 
USING (true);

-- Policy for INSERT - only admins and managers can add products
CREATE POLICY "Only admins and managers can add products" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Policy for UPDATE - only admins and managers can update products
CREATE POLICY "Only admins and managers can update products" 
ON products FOR UPDATE 
TO authenticated 
USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Policy for DELETE - only admins and managers can delete products
CREATE POLICY "Only admins and managers can delete products" 
ON products FOR DELETE 
TO authenticated 
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));
