'use client';
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { fetchNsps } from "@/lib/data";
import type { NSP } from "@/lib/definitions";
import { SubmitButton } from "@/app/nsp/components/submit-button";
import { Search as SearchIcon, X } from 'lucide-react';
import { NSPQuickLook } from "@/app/nsp/components/nsp-quick-look";

function RecordSubmissionsComponent() {
  const [nsps, setNsps] = useState<NSP[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  
  const firestore = useFirestore();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchData = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    
    // We fetch all NSPs and the submission logic is handled inside the SubmitButton
    const nspData = await fetchNsps(firestore, { queryString: query, month: currentMonth, year: currentYear });
    
    setNsps(nspData.nsps);
    setLoading(false);
  }, [firestore, query, currentMonth, currentYear]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search
    return () => clearTimeout(handler);
  }, [fetchData, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Record Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Find personnel and mark their monthly evaluation form submission.
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                placeholder="Search by Name, ID, or NSS Number to record submission..." 
                className="pl-9 pr-9 h-10" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            {loading ? (
            <div className="space-y-3 pt-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
            ) : (
                <SubmissionList nsps={nsps} onSubmissionSuccess={fetchData} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionList({ nsps, onSubmissionSuccess }: { nsps: NSP[], onSubmissionSuccess: () => void }) {
  if (nsps.length === 0) {
      return <p className="text-center text-muted-foreground py-12">No personnel found for this filter.</p>
  }
  
  return (
      <div className="space-y-2 pt-4">
          {nsps.map(nsp => (
              <Card key={nsp.id}>
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{nsp.fullName}</p>
                          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{nsp.id}</span>
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{nsp.nssNumber}</span>
                              <span className="truncate">{nsp.posting}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-4 w-full sm:w-auto justify-end">
                        <div className="flex-1 sm:flex-none">
                            <NSPQuickLook nsp={nsp} />
                        </div>
                        <div className="flex-1 sm:flex-none">
                            <SubmitButton nsp={nsp} onSubmissionSuccess={onSubmissionSuccess} />
                        </div>
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>
  );
}

export default function RecordSubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading...</div>}>
      <RecordSubmissionsComponent />
    </Suspense>
  )
}
