'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { deleteAllPersonnel, exportNspRegistry, fetchPendingUsers, updateUserStatus, fetchAllUsers, deleteUserAccount } from '@/lib/data';
import type { AppUser } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, FileDown, Eye, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import Papa from 'papaparse';


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
    const [isExporting, setIsExporting] = useState(false);
    const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [confirmationText, setConfirmationText] = useState('');
    const requiredConfirmation = 'permanently delete all records';

    useEffect(() => {
        if (!firestore) return;
        const loadUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const [pending, all] = await Promise.all([
                    fetchPendingUsers(firestore),
                    fetchAllUsers(firestore)
                ]);
                setPendingUsers(pending);
                setAllUsers(all.filter(u => u.status !== 'Pending'));
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        loadUsers();
    }, [firestore]);

    const handleDeleteAccount = async (userId: string) => {
        if (!firestore || !user) return;
        if (!confirm("Are you sure you want to permanently delete this user account?")) return;
        try {
            await deleteUserAccount(firestore, userId, { uid: user.uid, email: user.email });
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            setSelectedUser(null);
            toast({ title: 'Success', description: 'User account has been deleted permanently.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Action failed.' });
        }
    };

    const handleUserAction = async (userId: string, action: 'Active' | 'Rejected') => {
        if (!firestore || !user) return;
        try {
            await updateUserStatus(firestore, userId, action, { uid: user.uid, email: user.email });
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            toast({ title: 'Success', description: `User account has been ${action.toLowerCase()}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Action failed.' });
        }
    }

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

    const downloadBlob = (content: string, filename: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleExportRegistry = async () => {
        if (!firestore) return;
        setIsExporting(true);
        try {
            const data = await exportNspRegistry(firestore);
            if (data.length === 0) {
                toast({ title: 'No Data', description: 'The registry is empty, nothing to export.' });
                return;
            }
    
            const csvData = data.map(row => ({
                'System ID': row.id,
                'Email': row.email,
                'NSS Number': row.nssNumber,
                'Surname': row.surname,
                'Other Names': row.otherNames,
                'Institution': row.institution,
                'Course of Study': row.courseOfStudy,
                'Gender': row.gender,
                'Phone': row.phone,
                'Residential Address': row.residentialAddress,
                'GPS Address': row.gpsAddress,
                'Posting': row.posting,
                'Region': row.region,
                'District': row.district,
                'Next of Kin Name': row.nextOfKinName,
                'Next of Kin Phone': row.nextOfKinPhone,
                'Employed': row.isEmployed ? 'Yes' : 'No'
            }));
            
            const csv = Papa.unparse(csvData);
            downloadBlob(csv, `nsp_registry_backup_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    
            toast({ title: 'Export Successful', description: 'The NSP registry has been downloaded.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Export Failed', description: error.message || 'An unknown error occurred.' });
        } finally {
            setIsExporting(false);
        }
    }


    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-lg font-bold tracking-tight">Admin Settings</h1>
                <p className="text-muted-foreground">Manage system-wide configurations and dangerous operations.</p>
            </div>
            
            <Card className="border-border">
                <CardHeader>
                    <CardTitle>Pending Account Approvals</CardTitle>
                    <CardDescription>Review and approve new administrators or personnel desk officers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
                    ) : pendingUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg bg-muted/50">No pending users right now.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all">
                                    <div>
                                        <h4 className="font-medium text-sm">{u.fullName || "User"}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize mt-1">Role Requested: <strong className="text-foreground">{u.role}</strong></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleUserAction(u.id, 'Rejected')}>Reject</Button>
                                        <Button size="sm" onClick={() => handleUserAction(u.id, 'Active')}>Approve</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle>All User Accounts</CardTitle>
                    <CardDescription>View all active and rejected administrative accounts within the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
                    ) : allUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg bg-muted/50">No users found.</p>
                    ) : (
                        <div className="space-y-4">
                            {allUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm">{u.fullName || "User"}</h4>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                                                {u.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize mt-1">Role: <strong className="text-foreground">{u.role}</strong></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => setSelectedUser(u)} title="Quick Look">
                                            <Eye className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAccount(u.id)} title="Delete Account">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Account Details</DialogTitle>
                        <DialogDescription>
                            Detailed information for this user.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs font-semibold uppercase">Name</Label>
                                <div className="col-span-3 font-medium text-lg">{selectedUser.fullName || 'Not Provided'}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs font-semibold uppercase">Email</Label>
                                <div className="col-span-3 font-medium">{selectedUser.email}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs font-semibold uppercase">Role</Label>
                                <div className="col-span-3 capitalize">{selectedUser.role}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs font-semibold uppercase">Status</Label>
                                <div className="col-span-3 uppercase tracking-wider text-xs font-bold font-mono">
                                    <span className={selectedUser.status === 'Active' ? 'text-green-500' : selectedUser.status === 'Pending' ? 'text-yellow-500' : 'text-destructive'}>
                                        {selectedUser.status}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground text-xs font-semibold uppercase">ID</Label>
                                <div className="col-span-3 text-xs font-mono text-muted-foreground break-all">{selectedUser.id}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                                        This will permanently delete all <strong>NSP records</strong> and all of their associated <strong>monthly submissions</strong>. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                
                                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                                    <div className='flex items-start gap-3'>
                                        <FileDown className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900">Export Data First</h4>
                                            <p className="text-xs text-amber-800 mt-1 mb-2">
                                                It is highly recommended to export a full backup of the NSP registry before clearing all data.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleExportRegistry}
                                                disabled={isExporting}
                                                className="h-8 text-xs bg-white/50 border-amber-300 hover:bg-white"
                                            >
                                                {isExporting ? 'Exporting...' : 'Export Registry (CSV)'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 space-y-2">
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
