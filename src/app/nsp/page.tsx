import { fetchNsps } from "@/lib/data";
import { NSPTable } from "./components/nsp-table";
import { AddNSPButton } from "./components/buttons";
import Search from "./components/search";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function NspRegistryPage({
  searchParams
}: {
  searchParams?: {
    query?: string;
    page?: string;
  }
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  
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

async function NSPList({query, currentPage}: {query: string, currentPage: number}) {
  const { nsps, total } = await fetchNsps(query, currentPage);
  return <NSPTable nsps={nsps} />;
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
