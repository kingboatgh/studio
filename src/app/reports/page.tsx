'use client';
import React, { Suspense, useState, useEffect, useCallback } from "react";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { exportNspRegistry, getReportStats, exportSubmittedOrPending, getStaffSubmissionStats } from "@/lib/data";
import type { NSP, StaffSubmissionStat } from "@/lib/definitions";
import { Users, ClipboardCheck, Clock, TrendingUp, FileText } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


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
    { value: 7, label: 'July' }, { value: 8, 'label': 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function ReportsComponent() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<{ active: number; submitted: number; pending: number }>({ active: 0, submitted: 0, pending: 0 });
  const [staffStats, setStaffStats] = useState<StaffSubmissionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const firestore = useFirestore();

  const fetchData = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    
    const [statsData, staffData] = await Promise.all([
      getReportStats(firestore, month, year),
      getStaffSubmissionStats(firestore, month, year),
    ]);
    
    setStats(statsData);
    setStaffStats(staffData);
    setLoading(false);
  }, [firestore, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleExport = async (type: 'registry' | 'monthly' | 'submitted' | 'pending', format: 'csv' | 'pdf') => {
      if (!firestore) return;
      const exportKey = `${type}-${format}`;
      setIsExporting(exportKey);
  
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      let data: (NSP | any)[] = [];
      let headers: string[] = [];
      let filename = `report_${year}_${month}`;
  
      try {
          if (type === 'registry') {
              data = await exportNspRegistry(firestore);
              filename = 'nsp_registry';
              headers = [
                'System ID', 'Email', 'NSS Number', 'Surname', 'Other Names', 'Institution', 'Course of Study', 'Gender',
                'Phone', 'Residential Address', 'GPS Address', 'Posting', 'Region', 'District',
                'Next of Kin Name', 'Next of Kin Phone', 'Employed'
              ];
          } else if (type === 'monthly') {
              data = await exportSubmittedOrPending(firestore, month, year, undefined);
              filename = `monthly_report_${year}_${month}`;
              headers = ['System ID', 'Full Name', 'NSS Number', 'Posting', 'Submission Status'];
          } else if (type === 'submitted') {
              data = await exportSubmittedOrPending(firestore, month, year, true);
              filename = `submitted_${year}_${month}`;
              headers = ['System ID', 'Full Name', 'NSS Number', 'Posting'];
          } else { // pending
              data = await exportSubmittedOrPending(firestore, month, year, false);
              filename = `pending_${year}_${month}`;
              headers = ['System ID', 'Full Name', 'NSS Number', 'Posting'];
          }

          if (data.length === 0) {
            alert('No data available to export.');
            setIsExporting(null);
            return;
          }
  
          if (format === 'csv') {
              const csvData = data.map(row => {
                  if (type === 'registry') return {
                      'System ID': row.id, Email: row.email, 'NSS Number': row.nssNumber, Surname: row.surname, 'Other Names': row.otherNames, Institution: row.institution, 'Course of Study': row.courseOfStudy, Gender: row.gender,
                      Phone: row.phone, 'Residential Address': row.residentialAddress, 'GPS Address': row.gpsAddress, Posting: row.posting, Region: row.region, District: row.district,
                      'Next of Kin Name': row.nextOfKinName, 'Next of Kin Phone': row.nextOfKinPhone, Employed: row.isEmployed ? 'Yes' : 'No'
                  };
                  if (type === 'monthly') return {'System ID': row.id, 'Full Name': row.fullName, 'NSS Number': row.nssNumber, Posting: row.posting, 'Submission Status': row.hasSubmittedThisMonth ? 'Submitted' : 'Pending'};
                  return {'System ID': row.id, 'Full Name': row.fullName, 'NSS Number': row.nssNumber, Posting: row.posting};
              });

              const csv = Papa.unparse(csvData);
              downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
          } else { // pdf
              const doc = new jsPDF();
              const body = data.map(row => {
                  if (type === 'registry') return [
                    row.id, row.email, row.nssNumber, row.surname, row.otherNames, row.institution, row.courseOfStudy, row.gender,
                    row.phone, row.residentialAddress, row.gpsAddress, row.posting, row.region, row.district,
                    row.nextOfKinName, row.nextOfKinPhone, row.isEmployed ? 'Yes' : 'No'
                  ];
                  if (type === 'monthly') return [row.id, row.fullName, row.nssNumber, row.posting, row.hasSubmittedThisMonth ? 'Submitted' : 'Pending'];
                  return [row.id, row.fullName, row.nssNumber, row.posting];
              });
              doc.autoTable({ head: [headers], body });
              doc.save(`${filename}.pdf`);
          }
      } catch (error) {
          console.error(`Failed to export ${type} report:`, error);
          alert(`An error occurred while exporting the ${type} report.`);
      } finally {
          setIsExporting(null);
      }
  };

  const downloadBlob = (content: string, filename: string, contentType: string) => {
      const blob = new Blob([content], { type: contentType });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const completionPercentage = stats.active > 0 ? (stats.submitted / stats.active) * 100 : 0;
  
  const totalStaffSubmissions = staffStats.reduce((acc, curr) => acc + curr.submissionCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Export</h1>
            <p className="text-muted-foreground mt-1">
            Generate and download submission tracking reports
            </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
            <Select value={String(selectedDate.getMonth() + 1)} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                    <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <Select value={String(selectedDate.getFullYear())} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 w-[100px] text-xs">
                    <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>{format(selectedDate, 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-px grid-cols-2 lg:grid-cols-4 bg-border rounded-lg overflow-hidden">
                <StatCard title="Active NSPs" value={stats.active} icon={<Users />} loading={loading} />
                <StatCard title="Submitted" value={stats.submitted} icon={<ClipboardCheck />} loading={loading} />
                <StatCard title="Pending" value={stats.pending} icon={<Clock />} loading={loading} />
                <StatCard title="Completion" value={`${Math.round(completionPercentage)}%`} icon={<TrendingUp />} loading={loading} />
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Export Center</CardTitle>
                <CardDescription>Download reports in CSV or PDF format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
                <ReportItem
                    title="Monthly Submission Report"
                    description={`Complete report for ${format(selectedDate, 'MMMM yyyy')}`}
                    onCsvExport={() => handleExport('monthly', 'csv')}
                    onPdfExport={() => handleExport('monthly', 'pdf')}
                    isExporting={isExporting}
                    exportKey="monthly"
                />
                <ReportItem
                    title="Submitted NSPs Only"
                    description={`NSPs who have submitted this month`}
                    onCsvExport={() => handleExport('submitted', 'csv')}
                    onPdfExport={() => handleExport('submitted', 'pdf')}
                    isExporting={isExporting}
                    exportKey="submitted"
                />
                <ReportItem
                    title="Pending NSPs Only"
                    description={`NSPs yet to submit this month`}
                    onCsvExport={() => handleExport('pending', 'csv')}
                    onPdfExport={() => handleExport('pending', 'pdf')}
                    isExporting={isExporting}
                    exportKey="pending"
                />
                <ReportItem
                    title="NSP Registry Export"
                    description="Export the complete NSP registry"
                    onCsvExport={() => handleExport('registry', 'csv')}
                    onPdfExport={() => handleExport('registry', 'pdf')}
                    isExporting={isExporting}
                    exportKey="registry"
                />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Staff Submissions Report</CardTitle>
                <CardDescription>Submissions recorded for {format(selectedDate, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : staffStats.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead className="text-right">Submissions</TableHead>
                                <TableHead className="w-[150px] text-right">% of Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffStats.map(staff => {
                                const percentage = totalStaffSubmissions > 0 ? (staff.submissionCount / totalStaffSubmissions) * 100 : 0;
                                return (
                                    <TableRow key={staff.officerName}>
                                        <TableCell className="font-medium">{staff.officerName}</TableCell>
                                        <TableCell className="text-right font-mono">{staff.submissionCount}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Progress value={percentage} className="h-2 w-20"/>
                                                <span className="w-12 text-sm text-muted-foreground font-mono">{percentage.toFixed(1)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2"/>
                        <p className="font-medium">No staff submissions</p>
                        <p className="text-sm">No submissions were recorded for this period.</p>
                    </div>
                )}
            </CardContent>
          </Card>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number | string, icon: React.ReactNode, loading: boolean }) {
    return (
      <div className="bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">{React.cloneElement(icon as React.ReactElement, { className: "h-3.5 w-3.5"})} {title}</p>
         {loading ? <Skeleton className="h-7 w-12 mt-1" /> : (
            <p className="text-2xl font-bold">{value}</p>
        )}
      </div>
    )
}

function ReportItem({ title, description, onCsvExport, onPdfExport, isExporting, exportKey }: { title: string, description: string, onCsvExport: () => void, onPdfExport: () => void, isExporting: string | null, exportKey: string }) {
    return (
        <div className="p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                    <Button 
                        size="sm"
                        onClick={onCsvExport} 
                        disabled={!!isExporting} 
                        variant="outline"
                        className="h-8 text-xs"
                    >
                        {isExporting === `${exportKey}-csv` ? '...' : 'CSV'}
                    </Button>
                    <Button 
                        size="sm"
                        onClick={onPdfExport} 
                        disabled={!!isExporting} 
                        variant="outline"
                        className="h-8 text-xs"
                    >
                        {isExporting === `${exportKey}-pdf` ? '...' : 'PDF'}
                    </Button>
                </div>
            </div>
        </div>
    )
}


export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading Reports...</div>}>
      <ReportsComponent />
    </Suspense>
  )
}
