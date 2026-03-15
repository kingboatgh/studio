'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { fetchAuditLogs, deleteAuditLog } from '@/lib/data';
import type { AuditLog } from '@/lib/definitions';
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

function AuditLogDetails({ log }: { log: AuditLog }) {
    const details = log.details;

    if (!details) {
        return <span className="text-muted-foreground">No details</span>;
    }

    switch (log.action) {
        case 'PERMANENTLY_DELETED_NSP':
            return (
                <div className="text-sm space-y-1">
                    <p><span className="font-medium text-muted-foreground">Name:</span> {details.nspName}</p>
                    <p><span className="font-medium text-muted-foreground">ID:</span> <code className="text-xs bg-muted/80 px-1 py-0.5 rounded">{details.nspId}</code></p>
                </div>
            );
        case 'CLEARED_ALL_NSP_RECORDS':
            return (
                <div className="text-sm">
                    <p><span className="font-medium text-muted-foreground">Records Deleted:</span> {details.deletedCount}</p>
                </div>
            );
        default:
            return (
                <pre className="text-xs bg-muted p-2 rounded-md font-mono">
                    {JSON.stringify(details, null, 2)}
                </pre>
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
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();
    const { toast } = useToast();

    const getLogs = useCallback(async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const logData = await fetchAuditLogs(firestore);
            setLogs(logData);
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
                <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
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
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{formatAction(log.action)}</TableCell>
                                        <TableCell><AuditLogDetails log={log} /></TableCell>
                                        <TableCell>{log.adminEmail}</TableCell>
                                        <TableCell>{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Processing...'}</TableCell>
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
                <Button variant="destructive" size="icon" className="h-8 w-8">
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
