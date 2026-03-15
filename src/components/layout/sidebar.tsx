'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Upload, Building, LogOut, FileCheck, FileBarChart, History, ShieldAlert } from 'lucide-react';
import NavLink from './nav-link';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { isAdmin } = useAdmin();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return null; // Don't render sidebar if not authenticated
  }

  return (
    <aside className="hidden w-72 flex-col border-r bg-secondary p-4 md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="bg-primary p-2.5 rounded-lg">
          <Building className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">NSP Digital</h1>
      </div>
      <nav className="flex flex-col gap-1.5 font-medium">
        <NavLink href="/">
          <LayoutDashboard />
          Dashboard
        </NavLink>
        <NavLink href="/submissions">
          <FileCheck />
          Record Submissions
        </NavLink>
        <NavLink href="/reports">
          <FileBarChart />
          Reports
        </NavLink>
        <NavLink href="/nsp">
          <Users />
          NSP Registry
        </NavLink>
        <NavLink href="/nsp/upload">
          <Upload />
          Bulk Upload
        </NavLink>
        {isAdmin && (
            <>
                <Separator className="my-2 bg-border/70" />
                <p className="px-4 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider mb-1">Admin</p>
                <NavLink href="/audit-logs">
                    <History className="h-5 w-5" />
                    Audit Logs
                </NavLink>
                <NavLink href="/settings">
                    <ShieldAlert className="h-5 w-5" />
                    Settings
                </NavLink>
            </>
        )}
      </nav>
      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-9" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5" />
            Log Out
        </Button>
      </div>
    </aside>
  );
}
