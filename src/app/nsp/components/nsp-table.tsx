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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NSP ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead className="hidden md:table-cell">Service No.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.length > 0 ? (
            nsps.map((nsp) => (
              <TableRow key={nsp.id}>
                <TableCell className="font-medium">{nsp.id}</TableCell>
                <TableCell>{nsp.fullName}</TableCell>
                <TableCell className="hidden md:table-cell">{nsp.serviceNumber}</TableCell>
                <TableCell>
                  <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-400 bg-green-50 text-green-700' : ''}>
                    {nsp.isDisabled ? 'Inactive' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
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
              <TableCell colSpan={5} className="h-24 text-center">
                No NSP records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
