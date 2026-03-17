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
    <aside className="hidden w-64 flex-col border-r bg-secondary p-4 md:flex">
      <Link href="/" className="mb-4 flex items-center gap-2.5 px-2">
        <div className="bg-primary p-1.5 rounded-md">
          <Building className="h-4 w-4 text-primary-foreground" />
        </div>
        <h1 className="text-sm font-bold text-foreground">Nsp Manager</h1>
      </Link>
      <nav className="flex flex-col gap-1 text-sm font-medium">
        <NavLink href="/">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </NavLink>
        <NavLink href="/submissions">
          <FileCheck className="h-3.5 w-3.5" />
          Record Submissions
        </NavLink>
        <NavLink href="/reports">
          <FileBarChart className="h-3.5 w-3.5" />
          Reports
        </NavLink>
        <NavLink href="/nsp">
          <Users className="h-3.5 w-3.5" />
          NSP Registry
        </NavLink>
        <NavLink href="/nsp/upload">
          <Upload className="h-3.5 w-3.5" />
          Bulk Upload
        </NavLink>
        {isAdmin && (
            <>
                <Separator className="my-2 bg-border/70" />
                <p className="px-4 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider mb-1">Admin</p>
                <NavLink href="/audit-logs">
                    <History className="h-3.5 w-3.5" />
                    Audit Logs
                </NavLink>
                <NavLink href="/settings">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Settings
                </NavLink>
            </>
        )}
      </nav>
      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-9" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
        </Button>
      </div>
    </aside>
  );
}
