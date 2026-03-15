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
    <Card>
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Search placeholder="Search by Name, ID, or Service Number..." />
          <AddNSPButton />
        </div>
        <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
          <NSPList query={query} currentPage={currentPage} />
        </Suspense>
      </CardContent>
    </Card>
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
    <div className="rounded-md border">
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  )
}
