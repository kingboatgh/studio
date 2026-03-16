'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { Users, User, ClipboardCheck, Clock, ArrowRight, TrendingUp, FileBarChart, FileCheck } from "lucide-react";
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
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          An overview of NSP submissions for {format(new Date(), 'MMMM yyyy')}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total NSPs" value={stats?.totalNsps} icon={<Users />} loading={loading} variant="blue" />
        <StatCard title="Active NSPs" value={stats?.activeNsps} icon={<User />} loading={loading} variant="sky" />
        <StatCard title="Submitted" value={stats?.submittedThisMonth} icon={<ClipboardCheck />} loading={loading} variant="green" />
        <StatCard title="Pending" value={stats?.pendingThisMonth} icon={<Clock />} loading={loading} variant="orange" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Key actions at your fingertips.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <ActionButton href="/reports" icon={<FileBarChart/>} isPrimary>View Reports</ActionButton>
            <ActionButton href="/submissions" icon={<FileCheck/>}>Record Submission</ActionButton>
            <ActionButton href="/nsp/new" icon={<Users/>}>Add New NSP</ActionButton>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Monthly Progress</CardTitle>
              {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-xl font-bold text-primary">{Math.round(submissionPercentage)}%</p>}
            </div>
             <CardDescription>Submission completion for the current month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             {loading ? <Skeleton className="h-2 w-full" /> : <Progress value={submissionPercentage} className="h-2" />}
             <div className="flex justify-between text-sm text-muted-foreground">
                {loading ? <Skeleton className="h-5 w-24" /> : <span>{stats?.submittedThisMonth} submitted</span>}
                {loading ? <Skeleton className="h-5 w-24" /> : <span>{stats?.pendingThisMonth} pending</span>}
             </div>
             { !loading && stats && stats.pendingThisMonth > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 flex-shrink-0"/>
                    <span>{stats?.pendingThisMonth} NSPs are yet to submit for {format(new Date(), 'MMMM')}.</span>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const statCardVariants = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
}

function StatCard({ title, value, icon, loading, variant = 'blue' }: { title: string, value?: number, icon: React.ReactNode, loading: boolean, variant?: keyof typeof statCardVariants }) {
  const colors = statCardVariants[variant];
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <p className="text-xl font-bold">{value?.toLocaleString() ?? 0}</p>
          )}
        </div>
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", colors.bg)}>
          {React.cloneElement(icon as React.ReactElement, { className: cn("h-5 w-5", colors.text)})}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ href, icon, children, isPrimary = false }: { href: string, icon: React.ReactNode, children: React.ReactNode, isPrimary?: boolean }) {
  return (
    <Link href={href} className="block">
      <Button
        variant={isPrimary ? "default" : "outline"}
        className="w-full justify-start h-9 px-4"
      >
        <div className="flex items-center gap-3">
          {icon}
          {children}
        </div>
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </Link>
  );
}
