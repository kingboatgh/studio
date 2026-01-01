'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type NSP } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { createNewNSP, updateNSP, checkServiceNumberUniqueness } from '@/lib/data';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';

const FormSchema = z.object({
  serviceNumber: z.string({ invalid_type_error: 'Please enter a service number.' }).min(1, 'Service number is required.'),
  fullName: z.string().min(1, 'Full name is required.'),
  institution: z.string().min(1, 'Institution is required.'),
  posting: z.string().min(1, 'Posting is required.'),
  isDisabled: z.coerce.boolean()
});

type State = {
  errors?: {
      serviceNumber?: string[];
      fullName?: string[];
      institution?: string[];
      posting?: string[];
      isDisabled?: string[];
  };
  message?: string | null;
};


export function NSPForm({ nsp }: { nsp?: NSP }) {
  const { toast } = useToast();
  const router = useRouter();
  const [state, setState] = useState<State>({ message: null, errors: {} });
  const [isPending, setIsPending] = useState(false);
  const firestore = useFirestore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setState({ message: null, errors: {} }); // Clear previous errors

    const formData = new FormData(event.currentTarget);
    const validatedFields = FormSchema.safeParse({
        serviceNumber: formData.get('serviceNumber'),
        fullName: formData.get('fullName'),
        institution: formData.get('institution'),
        posting: formData.get('posting'),
        isDisabled: formData.get('isDisabled') ?? String(nsp?.isDisabled ?? false),
    });
    
    if (!validatedFields.success) {
      setState({
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to save NSP record.',
      });
      setIsPending(false);
      return;
    }

    const { serviceNumber, ...rest } = validatedFields.data;

    const isUnique = await checkServiceNumberUniqueness(firestore, serviceNumber, nsp?.id);
    if (!isUnique) {
        setState({
            errors: { serviceNumber: ['This service number is already in use.'] },
            message: 'Validation failed.'
        });
        setIsPending(false);
        return;
    }
    
    // Assume a default district for now
    const DISTRICT_ID = 'district1';

    try {
      if (nsp) {
        await updateNSP(firestore, nsp.id, { serviceNumber, districtId: DISTRICT_ID, ...rest });
        toast({ title: 'Success', description: 'NSP record updated successfully.' });
      } else {
        await createNewNSP(firestore, { serviceNumber, districtId: DISTRICT_ID, ...rest });
        toast({ title: 'Success', description: 'New NSP record created.' });
      }
      router.push('/nsp');
    } catch (error) {
      console.error(error);
      setState({ message: 'Database Error: Failed to save NSP record.' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{nsp ? 'Edit NSP Record' : 'Create New NSP Record'}</CardTitle>
          <CardDescription>
            {nsp ? `Editing details for ${nsp.fullName}.` : 'Fill in the details below to add a new person.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" defaultValue={nsp?.fullName} aria-describedby="fullName-error" />
            <div id="fullName-error" aria-live="polite" aria-atomic="true">
              {state.errors?.fullName && <p className="text-sm text-destructive mt-1">{state.errors.fullName[0]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceNumber">Service Number</Label>
            <Input id="serviceNumber" name="serviceNumber" defaultValue={nsp?.serviceNumber} aria-describedby="serviceNumber-error" />
             <div id="serviceNumber-error" aria-live="polite" aria-atomic="true">
              {state.errors?.serviceNumber && <p className="text-sm text-destructive mt-1">{state.errors.serviceNumber[0]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input id="institution" name="institution" defaultValue={nsp?.institution} aria-describedby="institution-error" />
             <div id="institution-error" aria-live="polite" aria-atomic="true">
              {state.errors?.institution && <p className="text-sm text-destructive mt-1">{state.errors.institution[0]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="posting">Posting</Label>
            <Input id="posting" name="posting" defaultValue={nsp?.posting} aria-describedby="posting-error" />
             <div id="posting-error" aria-live="polite" aria-atomic="true">
              {state.errors?.posting && <p className="text-sm text-destructive mt-1">{state.errors.posting[0]}</p>}
            </div>
          </div>
           {nsp && (
            <div className="space-y-2">
              <Label htmlFor="isDisabled">Status</Label>
              <Select name="isDisabled" defaultValue={String(nsp.isDisabled)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Active</SelectItem>
                  <SelectItem value="true">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
           )}
           {state.message && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
             </Alert>
           )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/nsp">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
