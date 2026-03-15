'use client';
import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubmissionWithNSP } from "@/lib/definitions";
import { useFirestore } from "@/firebase";
import { fetchSubmissionsForMonth } from "@/lib/data";
import { SubmissionsTable } from "./components/submissions-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

export default function SubmissionsPage() {
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>View Submissions</CardTitle>
        <CardDescription>Filter and view all monthly submissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Select value={String(reportMonth)} onValueChange={(val) => setReportMonth(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="flex-1 min-w-[100px]">
              <Input 
                type="number" 
                value={reportYear} 
                onChange={(e) => setReportYear(Number(e.target.value))} 
                placeholder="Year"
              />
            </div>
        </div>
        <Suspense key={`${reportMonth}-${reportYear}`} fallback={<TableSkeleton />}>
          <SubmissionsList month={reportMonth} year={reportYear} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function SubmissionsList({month, year}: {month: number, year: number}) {
  const [data, setData] = useState<SubmissionWithNSP[] | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function getSubmissions() {
        if (!firestore) return;
        setLoading(true);
        const result = await fetchSubmissionsForMonth(firestore, month, year);
        setData(result);
        setLoading(false);
    }
    getSubmissions();
  }, [month, year, firestore]);


  if (loading) {
    return <TableSkeleton />;
  }

  return <SubmissionsTable submissions={data ?? []} />;
}

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  )
}
