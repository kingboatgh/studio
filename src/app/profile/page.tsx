'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isUserAdmin, updateUserProfile } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    } else if(user?.email) {
      setDisplayName('');
    }
  }, [user]);

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore) return;

    setIsUpdating(true);
    try {
      // Update Firebase Auth profile
      await updateAuthProfile(user, { displayName });

      // Update Firestore user profile
      await updateUserProfile(firestore, user.uid, { fullName: displayName });

      toast({
        title: 'Profile Updated',
        description: 'Your name has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const role = isAdmin ? 'Administrator' : 'Desk Officer';

  if (isUserLoading || loadingRole) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-sm font-bold tracking-tight">User Profile</h1>
        <Card>
          <CardHeader className="items-center text-center border-b p-4">
            <Skeleton className="h-20 w-20 rounded-full mb-2" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4 p-4">
             <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-full" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 px-4 py-2.5 flex justify-end">
            <Skeleton className="h-7 w-20" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
       <h1 className="text-sm font-bold tracking-tight">User Profile</h1>
       <form onSubmit={handleProfileUpdate}>
        <Card>
          <CardHeader className="items-center text-center border-b p-4">
            <Avatar className="h-20 w-20 mb-2">
              <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? 'User'} />
              <AvatarFallback className="text-2xl">
                {user.email?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-sm">{displayName || user.email}</CardTitle>
            <CardDescription className="text-xs">{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs">Full Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
              />
               <p className="text-xs text-muted-foreground">This name will be used on submissions and reports.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2.5">
              <div className="flex items-center gap-2.5 text-xs font-medium">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Account Role</span>
              </div>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="gap-1 pl-1.5 text-xs">
                  {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                  {role}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 px-4 py-2.5 flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
