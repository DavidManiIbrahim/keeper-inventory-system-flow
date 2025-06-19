
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import AuthPage from '@/components/auth/AuthPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ProductsTable from '@/components/products/ProductsTable';
import CategoriesTable from '@/components/categories/CategoriesTable';
import SuppliersTable from '@/components/suppliers/SuppliersTable';
import StockTransactionsTable from '@/components/stock/StockTransactionsTable';
import PurchaseOrdersTable from '@/components/purchase-orders/PurchaseOrdersTable';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-lg text-gray-600">Welcome to your inventory management system</p>
            </div>
            <DashboardStats />
          </div>
        );
      case 'products':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Products</h1>
            <ProductsTable />
          </div>
        );
      case 'categories':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Categories</h1>
            <CategoriesTable />
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <SuppliersTable />
          </div>
        );
      case 'stock':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Stock Transactions</h1>
            <StockTransactionsTable />
          </div>
        );
      case 'purchase-orders':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <PurchaseOrdersTable />
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-lg text-gray-600">Welcome to your inventory management system</p>
            </div>
            <DashboardStats />
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;
