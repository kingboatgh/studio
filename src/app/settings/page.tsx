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
import { ShieldAlert, FileDown, Eye, Trash2, Users, UserCheck, Settings } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
            <div className="space-y-4 max-w-5xl mx-auto p-4 md:p-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <div className="mt-8">
                    <Skeleton className="h-10 w-full max-w-sm mb-6" />
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                    </Card>
                </div>
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
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Master Backoffice
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                        Manage system-wide configurations, administrator access, and perform critical data operations from one centralized hub.
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70"></div>
            </div>
            
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="w-full max-w-md grid grid-cols-3 mb-8 h-12 items-center p-1 bg-muted/50 backdrop-blur-sm border rounded-xl">
                    <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                        <Users className="w-4 h-4 mr-2" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full relative">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Approvals
                        {pendingUsers.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full text-destructive data-[state=active]:text-destructive">
                        <Settings className="w-4 h-4 mr-2" />
                        System
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle>All User Accounts</CardTitle>
                            <CardDescription>View and manage all active and rejected administrative accounts within the system.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingUsers ? (
                                <div className="space-y-3 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                            ) : allUsers.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-lg font-medium text-foreground">No users found.</p>
                                    <p className="text-sm text-muted-foreground">The system currently has no active user accounts.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-[300px]">User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allUsers.map((u) => (
                                            <TableRow key={u.id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="font-medium">{u.fullName || "User"}</div>
                                                    <div className="text-sm text-muted-foreground">{u.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-xs font-semibold">{u.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={u.status === 'Active' ? 'default' : 'destructive'} 
                                                        className={`uppercase text-[10px] px-2 py-0 rounded-full tracking-wider ${u.status === 'Active' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20' : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'}`}
                                                    >
                                                        {u.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600" onClick={() => setSelectedUser(u)} title="Quick Look">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-muted-foreground" onClick={() => handleDeleteAccount(u.id)} title="Delete Account">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/50">
                            <CardTitle className="text-blue-900 dark:text-blue-100">Pending Account Approvals</CardTitle>
                            <CardDescription className="text-blue-700/70 dark:text-blue-300/70">Review and approve new administrators or personnel desk officers requesting access.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingUsers ? (
                                <div className="space-y-3 p-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
                            ) : pendingUsers.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <UserCheck className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                                    <p className="text-xl font-medium text-foreground">All caught up!</p>
                                    <p className="text-sm text-muted-foreground mt-1">There are no pending user approvals right now.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-[300px]">User Details</TableHead>
                                            <TableHead>Requested Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingUsers.map(u => (
                                            <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="font-medium text-base">{u.fullName || "User"}</div>
                                                    <div className="text-sm text-muted-foreground">{u.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-3">
                                                        <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all" onClick={() => handleUserAction(u.id, 'Rejected')}>Reject</Button>
                                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm" onClick={() => handleUserAction(u.id, 'Active')}>Approve</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <Card className="border-destructive/30 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
                        <CardHeader className="bg-destructive/5 border-b border-destructive/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <ShieldAlert className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle className="text-destructive text-xl">Danger Zone</CardTitle>
                                    <CardDescription className="text-destructive/80 mt-1">These operations affect system-wide data and are completely irreversible.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl border border-destructive/20 bg-card p-6 shadow-sm">
                                <div>
                                    <h4 className="font-bold text-lg">Clear All NSP Records</h4>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-md">Permanently delete all personnel in the registry and wipe their entire submission history from the database.</p>
                                </div>
                                <AlertDialog onOpenChange={(open) => !open && setConfirmationText('')}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="lg" className="shadow-md shrink-0">Clear All Data</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-destructive/20 max-w-md">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                                <ShieldAlert className="h-5 w-5" />
                                                Are you absolutely sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-base pt-2">
                                                This will permanently delete all <strong className="text-foreground">NSP records</strong> and all of their associated <strong className="text-foreground">monthly submissions</strong>. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        
                                        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 mt-4 shadow-inner">
                                            <div className='flex items-start gap-3'>
                                                <div className="p-1.5 bg-amber-200/50 dark:bg-amber-900/50 rounded-md shrink-0">
                                                    <FileDown className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-amber-900 dark:text-amber-300">Export Data First</h4>
                                                    <p className="text-xs text-amber-800 dark:text-amber-400/80 mt-1 mb-3">
                                                        It is highly recommended to export a full backup of the registry before proceeding.
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleExportRegistry}
                                                        disabled={isExporting}
                                                        className="h-8 text-xs bg-white/80 dark:bg-background/80 border-amber-300 dark:border-amber-700 hover:bg-white dark:hover:bg-background shadow-sm"
                                                    >
                                                        {isExporting ? 'Exporting...' : 'Download Registry (CSV)'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 space-y-3">
                                            <Label htmlFor="confirmation" className="text-sm font-medium">To confirm, type "<span className="font-bold text-destructive select-all">{requiredConfirmation}</span>" below:</Label>
                                            <Input 
                                                id="confirmation"
                                                value={confirmationText}
                                                onChange={(e) => setConfirmationText(e.target.value)}
                                                className="focus-visible:ring-destructive"
                                                placeholder={requiredConfirmation}
                                            />
                                        </div>
                                        <AlertDialogFooter className="mt-6">
                                            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleClearAllData}
                                                disabled={isPending || confirmationText !== requiredConfirmation}
                                                className="bg-destructive hover:bg-destructive/90 text-white shadow-md"
                                            >
                                                {isPending ? 'Deleting all data...' : 'Delete everything'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="sm:max-w-md overflow-hidden p-0">
                    <div className="bg-muted/30 p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Account Details</DialogTitle>
                            <DialogDescription>
                                Administrative user profile information.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    {selectedUser && (
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                    <span className="text-2xl font-bold text-primary">
                                        {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.fullName || 'Not Provided'}</h3>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 rounded-xl border bg-muted/10 p-5">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
                                    <Badge variant="outline" className="capitalize text-sm bg-background">{selectedUser.role}</Badge>
                                </div>
                                <div className="flex items-center justify-between border-b pb-3">
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                                    <Badge 
                                        variant={selectedUser.status === 'Active' ? 'default' : selectedUser.status === 'Pending' ? 'secondary' : 'destructive'} 
                                        className={`uppercase text-xs tracking-widest ${selectedUser.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : selectedUser.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' : ''}`}
                                    >
                                        {selectedUser.status}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System ID</span>
                                    <span className="text-sm font-mono bg-muted/50 p-2 rounded-md break-all border">{selectedUser.id}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
