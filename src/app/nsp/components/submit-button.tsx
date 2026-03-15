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
import { createSubmission } from '@/lib/data';
import { useFirestore, useUser } from '@/firebase';
import { CheckCircle } from 'lucide-react';

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export function SubmitButton({ nsp, onSubmissionSuccess }: { nsp: NSP, onSubmissionSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>();
  const [currentYear, setCurrentYear] = useState<number>();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  // Assume a default district for now
  const DISTRICT_ID = 'district1';

  useEffect(() => {
    const date = new Date();
    setCurrentMonth(date.getMonth() + 1);
    setCurrentYear(date.getFullYear());
  }, []);

  async function handleSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to submit.',
        });
        setIsPending(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const month = Number(formData.get('month'));
    const year = Number(formData.get('year'));
    const officerName = user.email || 'Unknown User';

    if (!month || !year) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Month and year are required.',
      });
      setIsPending(false);
      return;
    }

    try {
      await createSubmission(firestore, DISTRICT_ID, nsp.id, month, year, officerName);
      toast({
        title: 'Submission Successful',
        description: `${nsp.fullName}'s submission for ${months.find(m => m.value === month)?.label} ${year} has been recorded.`,
      });
      onSubmissionSuccess?.();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsPending(false);
    }
  }

  if (nsp.hasSubmittedThisMonth) {
    return (
        <Button size="sm" disabled variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="mr-2 h-4 w-4" />
            Submitted
        </Button>
    );
  }

  if (currentMonth === undefined || currentYear === undefined) {
    return <Button size="sm" disabled>Submit</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            Submit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Monthly Submission</DialogTitle>
          <DialogDescription>
            Confirm submission for <span className="font-semibold">{nsp.fullName} ({nsp.id})</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmission}>
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
          </div>
          <DialogFooter>
             <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? 'Submitting...' : 'Confirm Submission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
