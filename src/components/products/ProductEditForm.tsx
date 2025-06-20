
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductEditFormProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

type ProductStatus = 'active' | 'discontinued' | 'out_of_stock';

const ProductEditForm = ({ product, open, onOpenChange, onProductUpdated }: ProductEditFormProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    unit_price: product.unit_price.toString(),
    cost_price: product.cost_price.toString(),
    quantity_in_stock: product.quantity_in_stock.toString(),
    minimum_stock_level: product.minimum_stock_level?.toString() || '',
    maximum_stock_level: product.maximum_stock_level?.toString() || '',
    category_id: product.category_id || '',
    supplier_id: product.supplier_id || '',
    barcode: product.barcode || '',
    image_url: product.image_url || '',
    status: product.status as ProductStatus
  });
  const { toast } = useToast();

  useState(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          supabase.from('categories').select('id, name').order('name'),
          supabase.from('suppliers').select('id, name').order('name')
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (suppliersRes.data) setSuppliers(suppliersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Product name and SKU are required",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          sku: formData.sku.trim(),
          unit_price: parseFloat(formData.unit_price) || 0,
          cost_price: parseFloat(formData.cost_price) || 0,
          quantity_in_stock: parseInt(formData.quantity_in_stock) || 0,
          minimum_stock_level: formData.minimum_stock_level ? parseInt(formData.minimum_stock_level) : null,
          maximum_stock_level: formData.maximum_stock_level ? parseInt(formData.maximum_stock_level) : null,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
          barcode: formData.barcode.trim() || null,
          image_url: formData.image_url.trim() || null,
          status: formData.status
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      onOpenChange(false);
      onProductUpdated();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
              <Input
                id="quantity_in_stock"
                type="number"
                min="0"
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_in_stock: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="minimum_stock_level">Minimum Stock Level</Label>
              <Input
                id="minimum_stock_level"
                type="number"
                min="0"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock_level: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="maximum_stock_level">Maximum Stock Level</Label>
              <Input
                id="maximum_stock_level"
                type="number"
                min="0"
                value={formData.maximum_stock_level}
                onChange={(e) => setFormData(prev => ({ ...prev, maximum_stock_level: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No supplier</SelectItem>
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
              <Select value={formData.status} onValueChange={(value: ProductStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Enter barcode (optional)"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="Enter image URL (optional)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter product description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditForm;
