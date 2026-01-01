import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { Users, CheckCircle, AlertCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NSPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNsps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total active personnel in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted this Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              For the current submission cycle
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending this Month</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Have not submitted for this cycle
            </p>
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
