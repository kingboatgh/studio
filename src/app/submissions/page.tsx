'use client';
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Search from "@/app/nsp/components/search";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { fetchNsps, getMonthlySubmissionStats, fetchSubmissionsForMonth } from "@/lib/data";
import type { NSP } from "@/lib/definitions";
import { SubmitButton } from "@/app/nsp/components/submit-button";
import { FileDown, LayoutGrid, List, Search as SearchIcon } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Add declaration for jspdf-autotable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function MonthlySubmissionsComponent() {
  const searchParams = useSearchParams();
  const pageQuery = searchParams.get('query') || '';
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ submitted: 0, pending: 0 });
  const [nsps, setNsps] = useState<NSP[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [listQuery, setListQuery] = useState('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const firestore = useFirestore();

  const fetchData = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    
    const [statsData, nspData] = await Promise.all([
      getMonthlySubmissionStats(firestore, month, year),
      fetchNsps(firestore, { queryString: pageQuery, month, year })
    ]);
    
    setStats({ submitted: statsData.submitted, pending: statsData.pending });
    setNsps(nspData.nsps);
    setLoading(false);
  }, [firestore, selectedDate, pageQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (val: string) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(val) - 1);
    setSelectedDate(newDate);
  }
    
  const handleYearChange = (val: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(val));
    setSelectedDate(newDate);
  }

  const handleExportCsv = async () => {
    if (!firestore) return;
    setIsExportingCsv(true);

    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    try {
      const submissions = await fetchSubmissionsForMonth(firestore, month, year);
      
      if (submissions.length === 0) {
        alert('No submissions found for the selected period.');
        setIsExportingCsv(false);
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
      link.setAttribute('download', `submissions_${year}_${month}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Failed to export CSV report:', error);
      alert('An error occurred while exporting the CSV report.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    if (!firestore) return;
    setIsExportingPdf(true);

    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    const monthLabel = months.find(m => m.value === month)?.label;

    try {
        const submissions = await fetchSubmissionsForMonth(firestore, month, year);
        if (submissions.length === 0) {
            alert('No submissions found for the selected period.');
            setIsExportingPdf(false);
            return;
        }

        const doc = new jsPDF();
        doc.text(`Submissions Report - ${monthLabel} ${year}`, 14, 15);

        doc.autoTable({
            startY: 20,
            head: [['NSP ID', 'Full Name', 'Service Number', 'Submitted By', 'Timestamp']],
            body: submissions.map(s => [
                s.nspId,
                s.nspFullName,
                s.nspServiceNumber,
                s.deskOfficerName || 'N/A',
                s.timestamp.toDate().toLocaleString()
            ]),
        });

        doc.save(`submissions_${year}_${month}.pdf`);

    } catch (error) {
        console.error('Failed to export PDF report:', error);
        alert('An error occurred while exporting the PDF report.');
    } finally {
        setIsExportingPdf(false);
    }
  };


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const filteredNsps = nsps.filter(nsp => 
    nsp.fullName.toLowerCase().includes(listQuery.toLowerCase()) ||
    (nsp.id && nsp.id.toLowerCase().includes(listQuery.toLowerCase())) ||
    nsp.serviceNumber.toLowerCase().includes(listQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter">Monthly Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Record and track NSP monthly evaluation form submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Submission</CardTitle>
              <CardDescription>Search by NSP ID, Service Number, or Name.</CardDescription>
            </CardHeader>
            <CardContent>
              <Search placeholder="Enter NSP ID (e.g., LDM0001)" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Select Period</CardTitle>
              <CardDescription>Filter submissions by month and year.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Select value={String(selectedDate.getMonth() + 1)} onValueChange={handleMonthChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedDate.getFullYear())} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
             <CardHeader>
                <CardTitle>Export Report</CardTitle>
                <CardDescription>Download submission data for the selected period.</CardDescription>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleExportCsv} disabled={isExportingCsv}>
                    <FileDown className="mr-2 h-4 w-4" /> 
                    {isExportingCsv ? 'Exporting...' : 'CSV'}
                </Button>
                <Button variant="outline" onClick={handleExportPdf} disabled={isExportingPdf}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {isExportingPdf ? 'Exporting...' : 'PDF'}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{format(selectedDate, 'MMMM yyyy')} Status</CardTitle>
              <CardDescription>Overview of personnel submissions for the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    {loading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-3xl font-bold">{stats.pending}</p>}
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    {loading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-3xl font-bold">{stats.submitted}</p>}
                    <p className="text-sm text-muted-foreground">Submitted</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-between items-center gap-2 border-t pt-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search personnel list..." 
                    className="pl-10" 
                    value={listQuery}
                    onChange={(e) => setListQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center rounded-lg p-1 bg-muted">
                  <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                  <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
                    <List className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-3 pt-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <SubmissionList nsps={filteredNsps} view={view} onSubmissionSuccess={fetchData} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SubmissionList({ nsps, view, onSubmissionSuccess }: { nsps: NSP[], view: string, onSubmissionSuccess: () => void }) {
  if (nsps.length === 0) {
      return <p className="text-center text-muted-foreground py-12">No personnel found for this period or filter.</p>
  }

  if (view === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {nsps.map(nsp => (
            <Card key={nsp.id} className="flex flex-col">
              <CardContent className="p-4 flex-grow">
                <p className="font-semibold">{nsp.fullName}</p>
                <p className="text-sm text-primary font-mono">{nsp.id}</p>
                <p className="text-sm text-muted-foreground">{nsp.posting}</p>
              </CardContent>
              <div className="border-t p-4">
                <SubmitButton nsp={nsp} onSubmissionSuccess={onSubmissionSuccess} />
              </div>
            </Card>
          ))}
        </div>
      )
  }
  
  return (
      <div className="space-y-2 pt-4">
          {nsps.map(nsp => (
              <Card key={nsp.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                      <div>
                          <p className="font-semibold">{nsp.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                              <span className="font-mono">{nsp.id}</span>
                              <span className="mx-2">•</span>
                              <span>{nsp.posting}</span>
                          </p>
                      </div>
                      <SubmitButton nsp={nsp} onSubmissionSuccess={onSubmissionSuccess} />
                  </CardContent>
              </Card>
          ))}
      </div>
  );
}

export default function MonthlySubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading Submissions...</div>}>
      <MonthlySubmissionsComponent />
    </Suspense>
  )
}
