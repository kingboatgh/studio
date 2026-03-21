'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { fetchAuditLogs, deleteAuditLog, fetchAllUsers } from '@/lib/data';
import type { AuditLog, AppUser } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
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


const formatAction = (action: string) => {
    if (!action) return 'Unknown Action';
    return action
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

function AuditLogDetails({ log, usersMap }: { log: AuditLog, usersMap?: Record<string, AppUser> }) {
    const details = log.details;

    if (!details) {
        return <span className="text-muted-foreground">No details</span>;
    }

    switch (log.action) {
        case 'PERMANENTLY_DELETED_NSP':
            return (
                <div className="text-sm space-y-1">
                    <p><span className="font-medium text-muted-foreground">Name:</span> {details.nspName}</p>
                    <p><span className="font-medium text-muted-foreground">NSS No:</span> <code className="text-xs bg-muted/80 px-1 py-0.5 rounded">{details.nssNumber}</code></p>
                </div>
            );
        case 'CLEARED_ALL_NSP_RECORDS':
            return (
                <div className="text-sm">
                    <p><span className="font-medium text-muted-foreground">Records Deleted:</span> {details.deletedCount}</p>
                </div>
            );
        case 'USER_ACTIVE':
        case 'USER_REJECTED':
        case 'USER_DELETED':
            const targetUser = usersMap?.[details.targetUserId];
            const nameToDisplay = details.targetUserName || targetUser?.fullName || 'Not Available';
            const roleToDisplay = details.targetUserRole || targetUser?.role || 'Unknown';
            return (
                <div className="text-sm space-y-1">
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-baseline">
                        <span className="font-medium text-muted-foreground w-12">Name:</span>
                        <span className="text-foreground">{nameToDisplay}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-baseline">
                        <span className="font-medium text-muted-foreground w-12">Email:</span>
                        <span className="text-foreground">{details.targetUserEmail}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-baseline">
                        <span className="font-medium text-muted-foreground w-12">Role:</span>
                        <span className="text-foreground capitalize">{roleToDisplay}</span>
                    </div>
                </div>
            );
        default:
            return (
                <div className="text-xs space-y-1.5">
                    {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:gap-2 sm:items-baseline">
                            <span className="font-medium text-muted-foreground capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-foreground break-all bg-muted/30 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
    }
}


export default function AuditLogsPage() {
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isAdminLoading && !isAdmin) {
            router.replace('/');
        }
    }, [isAdmin, isAdminLoading, router]);

    if (isAdminLoading || !isAdmin) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardContent className="p-4 space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return <AuditLogsContent />;
}

function AuditLogsContent() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, AppUser>>({});
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();
    const { toast } = useToast();

    const getLogs = useCallback(async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const [logData, allUsers] = await Promise.all([
                fetchAuditLogs(firestore),
                fetchAllUsers(firestore)
            ]);
            setLogs(logData);
            const userMapData: Record<string, AppUser> = {};
            for (const u of allUsers) {
                userMapData[u.id] = u;
            }
            setUsersMap(userMapData);
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: 'auditLogs',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to view audit logs.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch audit logs.' });
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    }, [firestore, toast]);

    useEffect(() => {
        getLogs();
    }, [getLogs]);

    const handleDelete = async (logId: string) => {
        if (!firestore) return;
        try {
            await deleteAuditLog(firestore, logId);
            toast({ title: 'Success', description: 'Audit log entry deleted.' });
            getLogs(); // Refetch logs
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: `auditLogs/${logId}`,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete log entry.' });
                console.error(error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground">History of critical administrative actions.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <TableRow key={log.id} className="group hover:bg-muted/5 transition-colors">
                                        <TableCell className="font-medium whitespace-nowrap">
                                            <Badge variant="outline" className={
                                                log.action.includes('DELETED') || log.action.includes('REJECTED') ? 'border-destructive/30 text-destructive bg-destructive/10' :
                                                log.action.includes('ACTIVE') || log.action.includes('APPROVED') ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10' :
                                                'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                                            }>
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4"><AuditLogDetails log={log} usersMap={usersMap} /></TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{log.adminEmail}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Processing...'}</TableCell>
                                        <TableCell className="text-right">
                                            <DeleteLogButton logId={log.id} onDelete={handleDelete} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No audit logs found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function DeleteLogButton({ logId, onDelete }: { logId: string, onDelete: (id: string) => Promise<void> }) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        await onDelete(logId);
        setIsPending(false);
    }
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this audit log entry. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                        {isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
