'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { Users, CheckCircle, AlertCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats({ totalNsps: 0, submittedThisMonth: 0, pendingThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Monthly Reports</CardTitle>
                <CardDescription>Export submission reports for any given month.</CardDescription>
            </div>
            <Button>
                <FileDown className="mr-2 h-4 w-4" />
                Export Report
            </Button>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Select month and year to generate and download a CSV report of all submissions.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
