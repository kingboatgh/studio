'use client';
import { fetchNsps } from "@/lib/data";
import { NSPTable } from "./components/nsp-table";
import { AddNSPButton } from "./components/buttons";
import Search from "./components/search";
import { Suspense, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NSP } from "@/lib/definitions";
import { useSearchParams } from "next/navigation";
import { useFirestore } from "@/firebase";

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

  useEffect(() => {
    async function getNsps() {
        setLoading(true);
        const result = await fetchNsps(firestore, query, currentPage);
        setData(result);
        setLoading(false);
    }
    getNsps();
  }, [query, currentPage, firestore]);


  if (loading) {
    return <TableSkeleton />;
  }

  return <NSPTable nsps={data?.nsps ?? []} />;
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
