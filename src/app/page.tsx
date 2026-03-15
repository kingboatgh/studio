'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { Users, User, ClipboardCheck, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import type { DashboardStats } from '@/lib/definitions';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const fetchData = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const dashboardStats = await getDashboardStats(firestore);
      setStats(dashboardStats);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStats({ totalNsps: 0, activeNsps: 0, submittedThisMonth: 0, pendingThisMonth: 0 });
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    if (firestore) {
      fetchData();
    }
  }, [firestore, fetchData]);


  const currentDate = format(new Date(), 'EEEE, d MMMM yyyy');
  const submissionPercentage = stats && stats.activeNsps > 0 ? (stats.submittedThisMonth / stats.activeNsps) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">{currentDate}</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of NSP management for {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total NSPs" value={stats?.totalNsps} icon={<Users />} loading={loading} iconBgColor="bg-blue-500" />
        <StatCard title="Active NSPs" value={stats?.activeNsps} icon={<User />} loading={loading} iconBgColor="bg-sky-500" />
        <StatCard title="Submitted" value={stats?.submittedThisMonth} icon={<ClipboardCheck />} loading={loading} iconBgColor="bg-green-500" />
        <StatCard title="Pending" value={stats?.pendingThisMonth} icon={<Clock />} loading={loading} iconBgColor="bg-orange-500" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionButton href="/submissions" isPrimary>Record Submission</ActionButton>
            <ActionButton href="/nsp/new">Add New NSP</ActionButton>
            <ActionButton href="/submissions">View Reports</ActionButton>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Monthly Progress</CardTitle>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-primary">{Math.round(submissionPercentage)}%</p>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
             {loading ? <Skeleton className="h-4 w-full" /> : <Progress value={submissionPercentage} className="h-2" />}
             <div className="flex justify-between text-sm text-muted-foreground">
                {loading ? <Skeleton className="h-5 w-24" /> : <span>{stats?.submittedThisMonth} submitted</span>}
                {loading ? <Skeleton className="h-5 w-24" /> : <span>{stats?.pendingThisMonth} pending</span>}
             </div>
             { !loading && stats && stats.pendingThisMonth > 0 && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5"/>
                    <span>{stats?.pendingThisMonth} NSPs yet to submit for {format(new Date(), 'MMMM')}</span>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconBgColor, loading }: { title: string, value?: number, icon: React.ReactNode, iconBgColor: string, loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="h-8 w-16 mt-1" /> : (
            <p className="text-3xl font-bold">{value?.toLocaleString() ?? 0}</p>
          )}
        </div>
        <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", iconBgColor)}>
          {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6 text-white"})}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ href, children, isPrimary = false }: { href: string, children: React.ReactNode, isPrimary?: boolean }) {
  return (
    <Link href={href}>
      <Button
        variant={isPrimary ? "default" : "outline"}
        className={cn("w-full justify-between", isPrimary ? "bg-green-600 hover:bg-green-700 text-white" : "")}
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
