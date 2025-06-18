
-- First, update the get_user_role function to be more permissive
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM profiles WHERE id = user_id), 'admin'::user_role);
$$;

-- Update RLS policies for categories table
DROP POLICY IF EXISTS "Admins and managers can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update RLS policies for suppliers table  
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON suppliers;
CREATE POLICY "Authenticated users can manage suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update RLS policies for products table
DROP POLICY IF EXISTS "Admins and managers can manage products" ON products;
CREATE POLICY "Authenticated users can manage products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update the dependent policies to be more permissive as well
DROP POLICY IF EXISTS "Admins and managers can manage stock transactions" ON stock_transactions;
CREATE POLICY "Authenticated users can manage stock transactions" ON stock_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and managers can manage purchase orders" ON purchase_orders;
CREATE POLICY "Authenticated users can manage purchase orders" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and managers can manage purchase order items" ON purchase_order_items;
CREATE POLICY "Authenticated users can manage purchase order items" ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Authenticated users can manage profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
