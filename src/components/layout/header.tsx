'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Building, LayoutDashboard, Menu, Upload, Users, LogOut, User as UserProfileIcon, FileCheck, FileBarChart, History, ShieldAlert } from 'lucide-react';
import NavLink from './nav-link';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { Separator } from '../ui/separator';

const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/profile')) return 'User Profile';
    if (pathname.startsWith('/submissions')) return 'Record Submissions';
    if (pathname.startsWith('/reports')) return 'Reports & Export';
    if (pathname.startsWith('/audit-logs')) return 'Audit Logs';
    if (pathname.startsWith('/settings')) return 'Admin Settings';
    if (pathname.startsWith('/nsp/new')) return 'Add New NSP';
    if (pathname.startsWith('/nsp/upload')) return 'Bulk Upload NSP Records';
    if (pathname.startsWith('/nsp') && pathname.includes('/edit')) return 'Edit NSP Record';
    if (pathname.startsWith('/nsp')) return 'NSP Registry';
    if (pathname.startsWith('/login')) return 'Login';
    return 'Nsp Manager';
}

export default function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { isAdmin } = useAdmin();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  if (!user) {
    return null; // Don't render header on login page or if not authenticated
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-secondary p-4">
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="/" className="flex items-center gap-3 text-base font-semibold text-primary mb-4 px-2">
              <div className="bg-primary p-1.5 rounded-md">
                <Building className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-foreground text-sm">Nsp Manager</span>
            </Link>
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
            
            {isAdmin && (
                <>
                    <NavLink href="/nsp/upload">
                        <Upload className="h-3.5 w-3.5" />
                        Bulk Upload
                    </NavLink>
                    <Separator className="my-2 bg-border/70" />
                    <p className="px-4 text-sm font-semibold text-muted-foreground/80">Admin</p>
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
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL ?? ""} alt="User" />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase() ?? 'A'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserProfileIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
