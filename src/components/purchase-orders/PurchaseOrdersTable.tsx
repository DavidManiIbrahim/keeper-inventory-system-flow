
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PurchaseOrderForm from './PurchaseOrderForm';
import { DeleteDialog } from '@/components/ui/delete-dialog';

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  order_date: string | null;
  expected_delivery_date: string | null;
  total_amount: number | null;
  suppliers: { name: string } | null;
}

const PurchaseOrdersTable = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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
    if (!deletingOrder) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', deletingOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });

      setDeletingOrder(null);
      fetchOrders();
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOrderAdded = () => {
    setIsDialogOpen(false);
    fetchOrders();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Purchase Orders</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                </DialogHeader>
                <PurchaseOrderForm onSuccess={handleOrderAdded} />
              </DialogContent>
            </Dialog>
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
                    <TableHead className="min-w-[120px]">Order Number</TableHead>
                    <TableHead className="min-w-[150px]">Supplier</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Order Date</TableHead>
                    <TableHead className="min-w-[140px]">Expected Delivery</TableHead>
                    <TableHead className="min-w-[120px]">Total Amount</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.suppliers?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{order.total_amount ? `$${order.total_amount}` : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast({ title: "Coming Soon", description: "Order editing will be available soon." })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingOrder(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        open={!!deletingOrder}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete order "${deletingOrder?.order_number}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default PurchaseOrdersTable;
