'use client';
import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { isUserAdmin } from '@/lib/data';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (user && firestore) {
        setIsAdminLoading(true);
        const adminStatus = await isUserAdmin(firestore, user.uid);
        setIsAdmin(adminStatus);
        setIsAdminLoading(false);
      } else if (!isUserLoading) {
        // user is not loading and is null, so not an admin
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
    }

    checkAdmin();
  }, [user, firestore, isUserLoading]);

  return { isAdmin, isAdminLoading };
}
