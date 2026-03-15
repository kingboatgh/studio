'use client';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { NSP } from '@/lib/definitions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function NSPQuickLook({ nsp }: { nsp: NSP }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Quick Look" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{nsp.fullName}</DialogTitle>
          <DialogDescription>NSP Details: {nsp.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            
            <Section title="Personal Information">
              <DetailRow label="System ID" value={nsp.id} />
              <DetailRow label="Full Name" value={nsp.fullName} />
              <DetailRow label="NSS Number" value={nsp.nssNumber} />
              <DetailRow label="Gender" value={nsp.gender} />
            </Section>
            
            <Separator/>

            <Section title="Contact Information">
              <DetailRow label="Email Address" value={nsp.email} />
              <DetailRow label="Phone Number" value={nsp.phone} />
              <DetailRow label="Residential Address" value={nsp.residentialAddress} />
              <DetailRow label="GPS Address" value={nsp.gpsAddress || 'N/A'} />
            </Section>

            <Separator/>

            <Section title="Academic & Posting Information">
              <DetailRow label="Institution" value={nsp.institution} />
              <DetailRow label="Course of Study" value={nsp.courseOfStudy} />
              <DetailRow label="Place of Service" value={nsp.posting} />
              <DetailRow label="Region" value={nsp.region} />
              <DetailRow label="District" value={nsp.district} />
              <DetailRow label="Service Year" value={String(nsp.serviceYear)} />
            </Section>

            <Separator/>
            
            <Section title="Other Information">
               <DetailRow label="Next of Kin" value={nsp.nextOfKinName} />
               <DetailRow label="Next of Kin Phone" value={nsp.nextOfKinPhone} />
               <DetailRow label="Employment Status">
                    <Badge variant={nsp.isEmployed ? 'secondary' : 'outline'}>{nsp.isEmployed ? 'Yes' : 'No'}</Badge>
                </DetailRow>
                <DetailRow label="Record Status">
                    <Badge variant={nsp.isDisabled ? 'outline' : 'secondary'} className={!nsp.isDisabled ? 'border-green-400 bg-green-50 text-green-700' : ''}>
                        {nsp.isDisabled ? 'Inactive' : 'Active'}
                    </Badge>
                </DetailRow>
            </Section>

            <Separator/>

            <Section title="System Information">
                <DetailRow label="Date Created" value={nsp.createdDate ? format(nsp.createdDate.toDate(), 'PPP') : 'N/A'} />
                <DetailRow label="Last Updated" value={nsp.lastUpdatedDate ? format(nsp.lastUpdatedDate.toDate(), 'PPP') : 'N/A'} />
            </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h4 className="mb-2 font-semibold text-primary">{title}</h4>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    )
}

function DetailRow({ label, value, children }: { label: string; value?: string, children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <div className="col-span-2 text-foreground">{value || children}</div>
    </div>
  );
}
