'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { NSP } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { createSubmissionAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export function SubmitButton({ nsp }: { nsp: NSP }) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>();
  const [currentYear, setCurrentYear] = useState<number>();
  const { toast } = useToast();

  useEffect(() => {
    const date = new Date();
    setCurrentMonth(date.getMonth() + 1);
    setCurrentYear(date.getFullYear());
  }, []);

  async function handleSubmission(formData: FormData) {
    const result = await createSubmissionAction(nsp.id, formData);

    if (result.success) {
      toast({
        title: 'Submission Successful',
        description: `${nsp.fullName}'s submission for ${months.find(m => m.value === Number(formData.get('month')))?.label} ${formData.get('year')} has been recorded.`,
      });
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
      });
    }
  }

  if (currentMonth === undefined || currentYear === undefined) {
    return <Button size="sm" disabled>Submit</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">Submit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Monthly Submission</DialogTitle>
          <DialogDescription>
            Confirm submission for <span className="font-semibold">{nsp.fullName} ({nsp.id})</span>.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmission}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">Month</Label>
              <Select name="month" defaultValue={String(currentMonth)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Input id="year" name="year" defaultValue={currentYear} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="officer" className="text-right">Officer</Label>
              <Input id="officer" name="officer" defaultValue="Desk Officer" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <SubmitDialogButton/>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitDialogButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
            {pending ? 'Submitting...' : 'Confirm Submission'}
        </Button>
    )
}
