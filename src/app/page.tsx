'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats, fetchNsps } from "@/lib/data";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import type { DashboardStats, NSP } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubmitButton } from '@/app/nsp/components/submit-button';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingNsps, setPendingNsps] = useState<NSP[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const fetchData = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const [dashboardStats, nspData] = await Promise.all([
        getDashboardStats(firestore),
        fetchNsps(firestore, { month, year })
      ]);
      
      setStats(dashboardStats);
      setPendingNsps(nspData.nsps.filter(nsp => !nsp.hasSubmittedThisMonth));

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStats({ totalNsps: 0, submittedThisMonth: 0, pendingThisMonth: 0 });
      setPendingNsps([]);
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total NSPs" 
          value={stats?.totalNsps} 
          description="Total active personnel" 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
          loading={loading}
        />
        <StatCard 
          title="Submitted this Month" 
          value={stats?.submittedThisMonth} 
          description="For the current submission cycle" 
          icon={<CheckCircle className="h-4 w-4 text-green-600" />} 
          loading={loading}
        />
        <StatCard 
          title="Pending this Month" 
          value={stats?.pendingThisMonth} 
          description="Have not submitted for this cycle" 
          icon={<AlertCircle className="h-4 w-4 text-orange-500" />} 
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Pending Submissions (Current Month)</CardTitle>
            <CardDescription>A list of personnel who have not yet submitted their evaluation forms.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : (
                <PendingNSPTable nsps={pendingNsps} onSubmissionSuccess={fetchData} />
            )}
        </CardContent>
      </Card>

    </div>
  );
}

function StatCard({ title, value, description, icon, loading }: { title: string, value?: number, description: string, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : (
          <>
            <div className="text-2xl font-bold">{value?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PendingNSPTable({ nsps, onSubmissionSuccess }: { nsps: NSP[], onSubmissionSuccess: () => void }) {
  if (nsps.length === 0) {
      return <p className="text-center text-muted-foreground py-8">All personnel have submitted for this month!</p>
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NSP ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead className="hidden md:table-cell">Posting</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nsps.map((nsp) => (
            <TableRow key={nsp.id}>
              <TableCell className="font-medium">{nsp.id}</TableCell>
              <TableCell>{nsp.fullName}</TableCell>
              <TableCell className="hidden md:table-cell">{nsp.posting}</TableCell>
              <TableCell className="text-right">
                <SubmitButton nsp={nsp} onSubmissionSuccess={onSubmissionSuccess} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
