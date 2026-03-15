'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { NSP } from '@/lib/definitions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function NSPQuickLook({ nsp }: { nsp: NSP }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Quick Look">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>NSP Details: {nsp.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <DetailRow label="Full Name" value={nsp.fullName} />
          <DetailRow label="Service Number" value={nsp.serviceNumber} />
          <DetailRow label="Institution" value={nsp.institution} />
          <DetailRow label="Posting" value={nsp.posting} />
          <DetailRow label="Service Year" value={String(nsp.serviceYear)} />
          <DetailRow label="Status">
             <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-400 bg-green-50 text-green-700' : ''}>
                {nsp.isDisabled ? 'Inactive' : 'Active'}
              </Badge>
          </DetailRow>
          <DetailRow label="Date Created" value={nsp.createdDate ? format(nsp.createdDate.toDate(), 'PPP') : 'N/A'} />
          <DetailRow label="Last Updated" value={nsp.lastUpdatedDate ? format(nsp.lastUpdatedDate.toDate(), 'PPP') : 'N/A'} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string, children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <div className="col-span-2">{value || children}</div>
    </div>
  );
}
