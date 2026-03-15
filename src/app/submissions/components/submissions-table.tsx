'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SubmissionWithNSP } from '@/lib/definitions';
import { format } from 'date-fns';

const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export function SubmissionsTable({ submissions }: { submissions: SubmissionWithNSP[] }) {
  if (!submissions) return <p className="text-center text-muted-foreground">Could not load submission data.</p>;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Service No.</TableHead>
            <TableHead className="hidden md:table-cell">Month</TableHead>
            <TableHead className="hidden md:table-cell">Year</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.nspFullName}</TableCell>
                <TableCell>{sub.nspServiceNumber}</TableCell>
                <TableCell className="hidden md:table-cell">{months.find(m => m.value === sub.month)?.label}</TableCell>
                <TableCell className="hidden md:table-cell">{sub.year}</TableCell>
                <TableCell>{sub.deskOfficerName}</TableCell>
                <TableCell>{format(sub.timestamp.toDate(), 'PPP p')}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No submissions found for the selected period.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
