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
import { Search as SearchIcon } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight">Record Submissions</h1>
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
                className="pl-9 h-10" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                />
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
                  <CardContent className="p-2.5 flex justify-between items-center">
                      <div>
                          <p className="font-semibold text-sm">{nsp.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                              <span className="font-mono">{nsp.id}</span>
                              <span className="mx-2">•</span>
                              <span>{nsp.posting}</span>
                          </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <NSPQuickLook nsp={nsp} />
                        <SubmitButton nsp={nsp} onSubmissionSuccess={onSubmissionSuccess} />
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
