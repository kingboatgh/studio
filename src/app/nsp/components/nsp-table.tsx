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
            <TableHead className="w-[120px] px-2 sm:px-4">System ID</TableHead>
            <TableHead className="px-2 sm:px-4">Full Name</TableHead>
            <TableHead className="hidden md:table-cell px-2 sm:px-4">NSS Number</TableHead>
            <TableHead className="hidden lg:table-cell px-2 sm:px-4">Place of Service</TableHead>
            <TableHead className="px-2 sm:px-4">Status</TableHead>
            <TableHead className="text-right w-[120px] px-2 sm:px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.length > 0 ? (
            nsps.map((nsp) => (
              <TableRow key={nsp.id} className="transition-colors hover:bg-muted/50">
                <TableCell className="font-medium px-2 sm:px-4 py-3">{nsp.id}</TableCell>
                <TableCell className="px-2 sm:px-4 py-3 font-medium">{nsp.fullName}</TableCell>
                <TableCell className="hidden md:table-cell px-2 sm:px-4 py-3">{nsp.nssNumber}</TableCell>
                <TableCell className="hidden lg:table-cell px-2 sm:px-4 py-3">{nsp.posting}</TableCell>
                <TableCell className="px-2 sm:px-4 py-3">
                  <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-400 bg-green-50 text-green-700' : ''}>
                    {nsp.isDisabled ? 'Inactive' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="px-2 sm:px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <NSPQuickLook nsp={nsp} />
                    {isAdmin && (
                      <>
                        <EditNSPButton id={nsp.id} />
                        <DeleteNSPButton id={nsp.id} name={nsp.fullName} onDeleted={onRefetch} />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No NSP records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
