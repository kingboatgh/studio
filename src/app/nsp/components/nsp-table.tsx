'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NSP } from '@/lib/definitions';
import { EditNSPButton } from './buttons';
import { SubmitButton } from './submit-button';

export function NSPTable({ nsps }: { nsps: NSP[] }) {
  if (!nsps) return <p className="text-center text-muted-foreground">Could not load NSP data.</p>;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NSP ID</TableHead>
            <TableHead>Service No.</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead className="hidden md:table-cell">Institution</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.length > 0 ? (
            nsps.map((nsp) => (
              <TableRow key={nsp.id}>
                <TableCell className="font-medium">{nsp.id}</TableCell>
                <TableCell>{nsp.serviceNumber}</TableCell>
                <TableCell>{nsp.fullName}</TableCell>
                <TableCell className="hidden md:table-cell">{nsp.institution}</TableCell>
                <TableCell>
                  <Badge variant={nsp.status === 'active' ? 'secondary' : 'destructive'}>
                    {nsp.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SubmitButton nsp={nsp} />
                    <EditNSPButton id={nsp.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No NSP records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
