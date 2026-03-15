'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isUserAdmin } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user && firestore) {
        setLoadingRole(true);
        const adminStatus = await isUserAdmin(firestore, user.uid);
        setIsAdmin(adminStatus);
        setLoadingRole(false);
      } else if (!isUserLoading) {
        setLoadingRole(false);
      }
    }
    checkAdminStatus();
  }, [user, firestore, isUserLoading]);

  const role = isAdmin ? 'Administrator' : 'Desk Officer';

  if (isUserLoading || loadingRole) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-4 w-56 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? 'User'} />
            <AvatarFallback className="text-3xl">
              {user.email?.charAt(0).toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.displayName || user.email}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>Role</span>
            </div>
            <Badge variant={isAdmin ? 'default' : 'secondary'} className="gap-1 pl-2">
                {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                {role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
