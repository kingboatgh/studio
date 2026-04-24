'use client';

import { useState, useEffect, use } from 'react';
import { fetchNspById } from '@/lib/data';
import { NSPForm } from '../../components/nsp-form';
import { notFound } from 'next/navigation';
import type { NSP } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';

export default function EditNSPPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [nsp, setNsp] = useState<NSP | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    async function getNsp() {
      const nspData = await fetchNspById(firestore, id);
      if (!nspData) {
        notFound();
      } else {
        setNsp(nspData as NSP);
      }
      setLoading(false);
    }
    getNsp();
  }, [id, firestore]);

  if (loading) {
    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {nsp && <NSPForm nsp={nsp} />}
    </div>
  );
}
