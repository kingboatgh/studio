'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Upload, Building, LogOut } from 'lucide-react';
import NavLink from './nav-link';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return null; // Don't render sidebar if not authenticated
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <Building className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">NSP Digital</h1>
      </div>
      <nav className="flex flex-col gap-2">
        <NavLink href="/">
          <LayoutDashboard />
          Dashboard
        </NavLink>
        <NavLink href="/nsp">
          <Users />
          NSP Registry
        </NavLink>
        <NavLink href="/nsp/upload">
          <Upload />
          Bulk Upload
        </NavLink>
      </nav>
      <div className="mt-auto">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
        </Button>
      </div>
    </aside>
  );
}
