
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface SupplierFormProps {
  onSupplierAdded: () => void;
}

const SupplierForm = ({ onSupplierAdded }: SupplierFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([{
          name: formData.name,
          contact_person: formData.contact_person || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier added successfully",
      });

      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: ''
      });
      setOpen(false);
      onSupplierAdded();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierForm;
