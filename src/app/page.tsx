'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats, fetchSubmissionsForMonth } from "@/lib/data";
import { Users, CheckCircle, AlertCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardStats, SubmissionWithNSP } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Papa from 'papaparse';

const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!firestore) return;
      try {
        const dashboardStats = await getDashboardStats(firestore);
        setStats(dashboardStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats({ totalNsps: 0, submittedThisMonth: 0, pendingThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [firestore]);

  const handleExport = async () => {
    if (!firestore) return;
    setIsExporting(true);

    try {
      const submissions = await fetchSubmissionsForMonth(firestore, reportMonth, reportYear);
      
      if (submissions.length === 0) {
        alert('No submissions found for the selected period.');
        setIsExporting(false);
        return;
      }
      
      const csvData = submissions.map(s => ({
        'NSP ID': s.nspId,
        'Full Name': s.nspFullName,
        'Service Number': s.nspServiceNumber,
        'Submission Month': months.find(m => m.value === s.month)?.label,
        'Submission Year': s.year,
        'Submitted By': s.deskOfficerName,
        'Timestamp': s.timestamp.toDate().toLocaleString(),
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `submissions_${reportYear}_${reportMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Failed to export report:', error);
      alert('An error occurred while exporting the report.');
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NSPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.totalNsps.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total active personnel in the system
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted this Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.submittedThisMonth.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  For the current submission cycle
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending this Month</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingThisMonth.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Have not submitted for this cycle
                </p>
              </>
             )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <div>
                <CardTitle>Monthly Reports</CardTitle>
                <CardDescription>Export submission reports for any given month.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
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
             <div className="flex-1 w-full sm:w-auto">
              <Input 
                type="number" 
                value={reportYear} 
                onChange={(e) => setReportYear(Number(e.target.value))} 
                placeholder="Year"
              />
            </div>
            <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
