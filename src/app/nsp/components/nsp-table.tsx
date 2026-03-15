'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { NSP } from '@/lib/definitions';
import { EditNSPButton, DeleteNSPButton } from './buttons';
import { NSPQuickLook } from './nsp-quick-look';


export function NSPTable({ nsps, isAdmin, onRefetch }: { nsps: NSP[], isAdmin: boolean, onRefetch: () => void }) {
  if (!nsps) return <p className="text-center text-muted-foreground">Could not load NSP data.</p>;

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground uppercase tracking-wider">NSP ID</TableHead>
            <TableHead className="text-muted-foreground uppercase tracking-wider">Full Name</TableHead>
            <TableHead className="hidden md:table-cell text-muted-foreground uppercase tracking-wider">Service No.</TableHead>
            <TableHead className="text-muted-foreground uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-right text-muted-foreground uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.length > 0 ? (
            nsps.map((nsp) => (
              <TableRow key={nsp.id} className="transition-colors hover:bg-muted/50">
                <TableCell className="font-medium py-4">{nsp.id}</TableCell>
                <TableCell className="py-4">{nsp.fullName}</TableCell>
                <TableCell className="hidden md:table-cell py-4">{nsp.serviceNumber}</TableCell>
                <TableCell className="py-4">
                  <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-400 bg-green-50 text-green-700' : ''}>
                    {nsp.isDisabled ? 'Inactive' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    <NSPQuickLook nsp={nsp} />
                    {isAdmin && (
                      <>
                        <EditNSPButton id={nsp.id} />
                        <DeleteNSPButton id={nsp.id} onDeleted={onRefetch} />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No NSP records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
