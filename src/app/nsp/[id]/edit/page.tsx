'use client';

import { useState, useEffect } from 'react';
import { fetchNspById } from '@/lib/data';
import { NSPForm } from '../../components/nsp-form';
import { notFound } from 'next/navigation';
import type { NSP } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditNSPPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [nsp, setNsp] = useState<NSP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getNsp() {
      const nspData = await fetchNspById(id);
      if (!nspData) {
        notFound();
      } else {
        setNsp(nspData as NSP);
      }
      setLoading(false);
    }
    getNsp();
  }, [id]);

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
