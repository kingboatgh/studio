import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil } from 'lucide-react';

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
