
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrderFormProps {
  onSuccess: () => void;
}

const PurchaseOrderForm = ({ onSuccess }: PurchaseOrderFormProps) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_number: '',
    status: 'pending',
    order_date: '',
    expected_delivery_date: '',
    total_amount: '',
    notes: '',
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
    generateOrderNumber();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const orderNumber = `PO-${timestamp}`;
    setFormData(prev => ({ ...prev, order_number: orderNumber }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('purchase_orders').insert({
        supplier_id: formData.supplier_id,
        order_number: formData.order_number,
        status: formData.status,
        order_date: formData.order_date || null,
        expected_delivery_date: formData.expected_delivery_date || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      onSuccess();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="order_number">Order Number</Label>
        <Input
          id="order_number"
          value={formData.order_number}
          onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <Select
          value={formData.supplier_id}
          onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="order_date">Order Date</Label>
        <Input
          id="order_date"
          type="date"
          value={formData.order_date}
          onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
        <Input
          id="expected_delivery_date"
          type="date"
          value={formData.expected_delivery_date}
          onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="total_amount">Total Amount</Label>
        <Input
          id="total_amount"
          type="number"
          step="0.01"
          value={formData.total_amount}
          onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Purchase Order'}
      </Button>
    </form>
  );
};

export default PurchaseOrderForm;
