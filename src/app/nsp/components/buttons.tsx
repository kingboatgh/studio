'use client';
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
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteNspPermanently } from '@/lib/data';

export function AddNSPButton() {
  return (
    <Link href="/nsp/new">
      <Button size="sm">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New
      </Button>
    </Link>
  );
}

export function EditNSPButton({ id }: { id: string }) {
    return (
      <Link href={`/nsp/${id}/edit`}>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Edit NSP">
            <Pencil className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

export function DeleteNSPButton({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: "Error", description: "You must be logged in as an admin to perform this action." });
      return;
    }
    setIsPending(true);
    try {
      await deleteNspPermanently(firestore, 'district1', id, name, { uid: user.uid, email: user.email });
      toast({ title: "Success", description: "NSP record has been permanently deleted." });
      onDeleted();
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `districts/district1/personnel/${id}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        console.error("Deletion failed:", error);
        toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to delete record." });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" className="h-8 w-8" aria-label="Delete NSP">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible and will permanently delete the NSP record for <span className="font-bold">{name}</span> and all of their associated submission data. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? 'Deleting...' : 'Yes, permanently delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
