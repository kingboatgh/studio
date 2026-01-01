import { fetchNspById } from '@/lib/data';
import { NSPForm } from '../../components/nsp-form';
import { notFound } from 'next/navigation';

export default async function EditNSPPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const nsp = await fetchNspById(id);

  if (!nsp) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <NSPForm nsp={nsp} />
    </div>
  );
}
