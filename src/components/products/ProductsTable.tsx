
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProductForm from './ProductForm';
import { DeleteDialog } from '@/components/ui/delete-dialog';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  minimum_stock_level: number | null;
  maximum_stock_level: number | null;
  category_id: string | null;
  supplier_id: string | null;
  barcode: string | null;
  image_url: string | null;
  status: string;
  categories: { name: string } | null;
  suppliers: { name: string } | null;
}

const ProductsTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('get_user_role', { user_id: user.id });
        if (!error) {
          setUserRole(data || 'employee');
        }
      }
    } catch (error) {
      console.log('Error fetching user role:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) {
        if (error.message.includes('row-level security')) {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You don't have permission to delete products. Only admins and managers can perform this action.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        setDeletingProduct(null);
        fetchProducts();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (current: number, min: number | null) => {
    if (min && current <= min) {
      return { label: 'Low Stock', color: 'bg-red-100 text-red-800' };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const handleProductAdded = () => {
    setIsDialogOpen(false);
    fetchProducts();
  };

  const canManageProducts = userRole === 'admin' || userRole === 'manager';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Products</CardTitle>
            {canManageProducts && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <ProductForm onProductAdded={handleProductAdded} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[120px]">Supplier</TableHead>
                    <TableHead className="min-w-[100px]">Unit Price</TableHead>
                    <TableHead className="min-w-[100px]">Cost Price</TableHead>
                    <TableHead className="min-w-[120px]">Stock</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    {canManageProducts && <TableHead className="min-w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.quantity_in_stock, product.minimum_stock_level);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.categories?.name || 'No Category'}</TableCell>
                        <TableCell>{product.suppliers?.name || 'No Supplier'}</TableCell>
                        <TableCell>₦{product.unit_price}</TableCell>
                        <TableCell>₦{product.cost_price}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{product.quantity_in_stock}</span>
                            <Badge className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        {canManageProducts && (
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default ProductsTable;
