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
            <TableHead className="hidden sm:table-cell w-[120px] px-3 sm:px-4">System ID</TableHead>
            <TableHead className="px-3 sm:px-4">Personnel Details</TableHead>
            <TableHead className="hidden md:table-cell px-3 sm:px-4">NSS Number</TableHead>
            <TableHead className="hidden lg:table-cell px-3 sm:px-4">Batch</TableHead>
            <TableHead className="hidden xl:table-cell px-3 sm:px-4">Place of Service</TableHead>
            <TableHead className="px-3 sm:px-4">Status</TableHead>
            <TableHead className="text-right w-[100px] sm:w-[140px] px-3 sm:px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.length > 0 ? (
            nsps.map((nsp) => (
              <TableRow key={nsp.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="hidden sm:table-cell px-3 sm:px-4 py-3">
                  <span className="text-xs font-mono bg-muted/50 px-2 py-1 rounded-md border text-muted-foreground">{nsp.id}</span>
                </TableCell>
                <TableCell className="px-3 sm:px-4 py-3 min-w-[160px]">
                  <div className="font-semibold text-sm whitespace-normal leading-tight break-words">{nsp.fullName}</div>
                  <div className="md:hidden flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">{nsp.nssNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell px-3 sm:px-4 py-3 font-mono text-sm text-muted-foreground">{nsp.nssNumber}</TableCell>
                <TableCell className="hidden lg:table-cell px-3 sm:px-4 py-3 text-sm text-muted-foreground">
                  {nsp.batch ? `${nsp.batch === 'University' ? 'University' : nsp.batch} / ${nsp.year}` : 'N/A'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-3 sm:px-4 py-3 text-sm truncate max-w-[200px]">{nsp.posting}</TableCell>
                <TableCell className="px-3 sm:px-4 py-3">
                  <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-200 bg-green-50 text-green-700 shadow-sm' : 'text-muted-foreground shadow-sm'}>
                    {nsp.isDisabled ? 'Inactive' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 sm:px-4 py-3">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
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
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                No NSP records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
