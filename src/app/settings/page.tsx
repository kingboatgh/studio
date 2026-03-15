
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { deleteAllPersonnel } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isAdminLoading && !isAdmin) {
            router.replace('/');
        }
    }, [isAdmin, isAdminLoading, router]);

    if (isAdminLoading || !isAdmin) {
        return (
            <div className="space-y-4 max-w-2xl mx-auto">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
            </div>
        );
    }
    
    return <SettingsContent />;
}

function SettingsContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const requiredConfirmation = 'permanently delete all records';

    const handleClearAllData = async () => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication error.' });
            return;
        }
        setIsPending(true);
        try {
            await deleteAllPersonnel(firestore, { uid: user.uid, email: user.email });
            toast({ title: 'Success', description: 'All NSP records and their submissions have been deleted.' });
            setConfirmationText(''); // Reset on success
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: 'districts/district1/personnel',
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to clear data.' });
            }
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
                <p className="text-muted-foreground">Manage system-wide configurations and dangerous operations.</p>
            </div>
            <Card className="border-destructive">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </div>
                    <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <div>
                            <h4 className="font-semibold">Clear All NSP Records</h4>
                            <p className="text-sm text-muted-foreground">Permanently delete all personnel and submission data.</p>
                        </div>
                        <AlertDialog onOpenChange={(open) => !open && setConfirmationText('')}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Clear All Data</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all <strong>NSP records</strong> and all of their associated <strong>monthly submissions</strong>. This action cannot be undone and data will be lost forever.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4 space-y-2">
                                    <Label htmlFor="confirmation">To confirm, type "<span className="font-bold text-destructive">{requiredConfirmation}</span>" below:</Label>
                                    <Input 
                                        id="confirmation"
                                        value={confirmationText}
                                        onChange={(e) => setConfirmationText(e.target.value)}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleClearAllData}
                                        disabled={isPending || confirmationText !== requiredConfirmation}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isPending ? 'Deleting all data...' : 'I understand, delete all data'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}
