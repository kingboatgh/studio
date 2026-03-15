'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Building, LayoutDashboard, Menu, Upload, Users, LogOut, User as UserProfileIcon, FileCheck } from 'lucide-react';
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

const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/profile')) return 'User Profile';
    if (pathname.startsWith('/submissions')) return 'All Submissions';
    if (pathname.startsWith('/nsp/new')) return 'Add New NSP';
    if (pathname.startsWith('/nsp/upload')) return 'Bulk Upload NSP Records';
    if (pathname.startsWith('/nsp') && pathname.includes('/edit')) return 'Edit NSP Record';
    if (pathname.startsWith('/nsp')) return 'NSP Registry';
    if (pathname.startsWith('/login')) return 'Login';
    return 'NSP Digital Submissions';
}

export default function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  if (!user) {
    return null; // Don't render header on login page or if not authenticated
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Building className="h-6 w-6" />
              <span>NSP Digital</span>
            </Link>
            <NavLink href="/">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
            </NavLink>
            <NavLink href="/submissions">
                <FileCheck className="h-5 w-5" />
                Submissions
            </NavLink>
            <NavLink href="/nsp">
                <Users className="h-5 w-5" />
                NSP Registry
            </NavLink>
            <NavLink href="/nsp/upload">
                <Upload className="h-5 w-5" />
                Bulk Upload
            </NavLink>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-between">
        <h1 className="text-lg font-semibold md:text-xl">{getPageTitle(pathname)}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user.photoURL ?? "https://i.pravatar.cc/150"} alt="User" />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase() ?? 'A'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
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
