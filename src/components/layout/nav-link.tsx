'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-background font-semibold text-primary shadow-sm',
      )}
    >
      {children}
    </Link>
  );
}
