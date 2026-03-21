'use client';
import { fetchNsps } from "@/lib/data";
import { NSPTable } from "./components/nsp-table";
import { AddNSPButton } from "./components/buttons";
import Search from "./components/search";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NSP } from "@/lib/definitions";
import { useSearchParams, usePathname } from "next/navigation";
import { useFirestore } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

export default function NspRegistryPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const { isAdmin } = useAdmin();
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">NSP Registry</h1>
            <p className="text-muted-foreground">Manage all personnel records.</p>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <Search placeholder="Search by Name, ID, NSS No, Email..." />
            {isAdmin && <AddNSPButton />}
          </div>
        </div>
        <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
          <NSPList query={query} currentPage={currentPage} />
        </Suspense>
    </div>
  );
}

function NSPList({query, currentPage}: {query: string, currentPage: number}) {
  const [data, setData] = useState<{nsps: NSP[], totalPages: number} | null>(null);
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

  return (
    <div className="space-y-4">
        <NSPTable nsps={data?.nsps ?? []} isAdmin={isAdmin} onRefetch={handleRefetch} />
        {data && data.totalPages > 1 && (
            <PaginationControls currentPage={currentPage} totalPages={data.totalPages} />
        )}
    </div>
  );
}

function PaginationControls({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pageNumbers = [];
  const MAX_PAGES_SHOWN = 5;

  if (totalPages <= MAX_PAGES_SHOWN) {
      for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
      }
  } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
          startPage = 1;
          endPage = MAX_PAGES_SHOWN;
      } else if (currentPage >= totalPages - 2) {
          startPage = totalPages - MAX_PAGES_SHOWN + 1;
          endPage = totalPages;
      }
      
      for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i);
      }
  }

  return (
      <Pagination>
          <PaginationContent>
              <PaginationItem>
                  <PaginationPrevious 
                      href={createPageURL(currentPage - 1)} 
                      aria-disabled={currentPage <= 1}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
              </PaginationItem>

              {pageNumbers[0] > 1 && (
                  <>
                      <PaginationItem>
                          <PaginationLink href={createPageURL(1)}>1</PaginationLink>
                      </PaginationItem>
                      {pageNumbers[0] > 2 && <PaginationEllipsis />}
                  </>
              )}

              {pageNumbers.map(page => (
                  <PaginationItem key={page}>
                      <PaginationLink href={createPageURL(page)} isActive={currentPage === page}>
                          {page}
                      </PaginationLink>
                  </PaginationItem>
              ))}
              
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                       {pageNumbers[pageNumbers.length - 1] < totalPages -1 && <PaginationEllipsis />}
                      <PaginationItem>
                          <PaginationLink href={createPageURL(totalPages)}>{totalPages}</PaginationLink>
                      </PaginationItem>
                  </>
              )}

              <PaginationItem>
                  <PaginationNext 
                      href={createPageURL(currentPage + 1)} 
                      aria-disabled={currentPage >= totalPages}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
              </PaginationItem>
          </PaginationContent>
      </Pagination>
  );
}


function TableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  )
}
