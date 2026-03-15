'use client';
import { fetchNsps } from "@/lib/data";
import { NSPTable } from "./components/nsp-table";
import { AddNSPButton } from "./components/buttons";
import Search from "./components/search";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NSP } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";

export default function NspRegistryPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NSP Registry</h1>
            <p className="text-muted-foreground">Manage all personnel records.</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2">
            <Search placeholder="Search by Name, ID, NSS No, Email..." />
            <AddNSPButton />
          </div>
        </div>
        <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
          <NSPList query={query} currentPage={currentPage} />
        </Suspense>
    </div>
  );
}

function NSPList({query, currentPage}: {query: string, currentPage: number}) {
  const [data, setData] = useState<{nsps: NSP[], total: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { isAdmin, isAdminLoading } = useAdmin();
  const [key, setKey] = useState(0); // Used to trigger a re-fetch

  const getNsps = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    const result = await fetchNsps(firestore, { 
      queryString: query, 
      page: currentPage,
    });
    setData(result);
    setLoading(false);
  }, [firestore, query, currentPage]);

  useEffect(() => {
    getNsps();
  }, [getNsps, key]);

  const handleRefetch = () => {
    setKey(prev => prev + 1);
  };


  if (loading || isAdminLoading) {
    return <TableSkeleton />;
  }

  return <NSPTable nsps={data?.nsps ?? []} isAdmin={isAdmin} onRefetch={handleRefetch} />;
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  )
}
