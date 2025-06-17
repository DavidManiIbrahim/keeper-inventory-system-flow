
-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

-- Create enum for product status
CREATE TYPE product_status AS ENUM ('active', 'discontinued', 'out_of_stock');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('in', 'out', 'adjustment');

-- Create profiles table for user management
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 0,
  maximum_stock_level INTEGER,
  status product_status DEFAULT 'active',
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_transactions table
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_value DECIMAL(10,2),
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'pending',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_order_items table
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage categories" ON categories FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for suppliers
CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage suppliers" ON suppliers FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for products
CREATE POLICY "Anyone can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage products" ON products FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for stock_transactions
CREATE POLICY "Anyone can view stock transactions" ON stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated users can create stock transactions" ON stock_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins and managers can manage stock transactions" ON stock_transactions FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_orders
CREATE POLICY "Anyone can view purchase orders" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage purchase orders" ON purchase_orders FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_order_items
CREATE POLICY "Anyone can view purchase order items" ON purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage purchase order items" ON purchase_order_items FOR ALL TO authenticated 
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update stock after transactions
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    UPDATE products 
    SET quantity_in_stock = quantity_in_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE products 
    SET quantity_in_stock = quantity_in_stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE products 
    SET quantity_in_stock = NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for stock updates
CREATE TRIGGER update_stock_trigger
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO categories (name, description) VALUES 
  ('Electronics', 'Electronic devices and components'),
  ('Office Supplies', 'General office supplies and stationery'),
  ('Furniture', 'Office and home furniture'),
  ('Software', 'Software licenses and digital products');

INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES 
  ('Tech Solutions Inc', 'John Smith', 'john@techsolutions.com', '+1-555-0123', '123 Tech Street, Silicon Valley, CA'),
  ('Office Pro Supply', 'Sarah Johnson', 'sarah@officepro.com', '+1-555-0456', '456 Business Ave, New York, NY'),
  ('Furniture World', 'Mike Wilson', 'mike@furnitureworld.com', '+1-555-0789', '789 Furniture Blvd, Chicago, IL');
