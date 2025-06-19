
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalSuppliers: number;
  lowStockProducts: number;
  recentTransactions: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockProducts: 0,
    recentTransactions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get total suppliers
      const { count: totalSuppliers } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true });

      // Get low stock products
      const { count: lowStockProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('quantity_in_stock', 'minimum_stock_level');

      // Get recent transactions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentTransactions } = await supabase
        .from('stock_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalProducts: totalProducts || 0,
        totalSuppliers: totalSuppliers || 0,
        lowStockProducts: lowStockProducts || 0,
        recentTransactions: recentTransactions || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Suppliers',
      value: stats.totalSuppliers,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Recent Transactions',
      value: stats.recentTransactions,
      icon: ShoppingCart,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:max-w-6xl 2xl:mx-auto">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
