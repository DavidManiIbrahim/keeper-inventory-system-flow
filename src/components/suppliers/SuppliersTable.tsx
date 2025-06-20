
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SupplierForm from './SupplierForm';
import SupplierEditForm from './SupplierEditForm';
import { DeleteDialog } from '@/components/ui/delete-dialog';

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

const SuppliersTable = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
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
    if (!deletingSupplier) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', deletingSupplier.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });

      setDeletingSupplier(null);
      fetchSuppliers();
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

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suppliers</CardTitle>
            <SupplierForm onSupplierAdded={fetchSuppliers} />
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                    <TableCell>{supplier.email || 'N/A'}</TableCell>
                    <TableCell>{supplier.phone || 'N/A'}</TableCell>
                    <TableCell>{supplier.address || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSupplier(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingSupplier(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingSupplier && (
        <SupplierEditForm
          supplier={editingSupplier}
          open={!!editingSupplier}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
          onSupplierUpdated={fetchSuppliers}
        />
      )}

      <DeleteDialog
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${deletingSupplier?.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default SuppliersTable;
