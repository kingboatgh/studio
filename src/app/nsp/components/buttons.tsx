import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateNSP } from '@/lib/data';

export function AddNSPButton() {
  return (
    <Link href="/nsp/new">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New NSP
      </Button>
    </Link>
  );
}

export function EditNSPButton({ id }: { id: string }) {
    return (
      <Link href={`/nsp/${id}/edit`}>
        <Button variant="outline" size="sm" aria-label="Edit NSP">
            <Pencil className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

export function DeleteNSPButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore) return;
    setIsPending(true);
    try {
      // Assuming a default district for now for the update operation
      await updateNSP(firestore, id, { isDisabled: true, districtId: 'district1' });
      toast({ title: "Success", description: "NSP record has been deactivated." });
      onDeleted(); // Re-fetch data on parent component
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to deactivate record." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" aria-label="Delete NSP">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the NSP record as inactive. It will no longer appear in most lists, but can be reactivated by editing the record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deactivating...' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
