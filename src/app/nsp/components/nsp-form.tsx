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
import { createNewNSP, updateNSP, checkNssNumberUniqueness } from '@/lib/data';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { Separator } from '@/components/ui/separator';

const FormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  nssNumber: z.string().min(1, 'NSS number is required.'),
  surname: z.string().min(1, 'Surname is required.'),
  otherNames: z.string().min(1, 'Other names are required.'),
  institution: z.string().min(1, 'Institution is required.'),
  courseOfStudy: z.string().min(1, 'Course of study is required.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().min(1, 'Phone number is required.'),
  residentialAddress: z.string().min(1, 'Residential address is required.'),
  gpsAddress: z.string().optional(),
  posting: z.string().min(1, 'Place of service is required.'),
  region: z.string().min(1, 'Region is required.'),
  district: z.string().min(1, 'District is required.'),
  nextOfKinName: z.string().min(1, 'Next of kin name is required.'),
  nextOfKinPhone: z.string().min(1, 'Next of kin phone is required.'),
  isEmployed: z.coerce.boolean(),
  isDisabled: z.coerce.boolean()
});

type State = {
  errors?: {
    [key: string]: string[] | undefined;
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
    setState({ message: null, errors: {} });

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const validatedFields = FormSchema.safeParse({
        ...data,
        isEmployed: data.isEmployed === 'true',
        isDisabled: data.isDisabled ?? String(nsp?.isDisabled ?? false),
    });
    
    if (!validatedFields.success) {
      setState({
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to save NSP record.',
      });
      setIsPending(false);
      return;
    }

    const { nssNumber, ...rest } = validatedFields.data;

    const isUnique = await checkNssNumberUniqueness(firestore, nssNumber, nsp?.id);
    if (!isUnique) {
        setState({
            errors: { nssNumber: ['This NSS number is already in use.'] },
            message: 'Validation failed.'
        });
        setIsPending(false);
        return;
    }
    
    const DISTRICT_ID = 'district1';

    try {
      if (nsp) {
        await updateNSP(firestore, nsp.id, { nssNumber, districtId: DISTRICT_ID, ...rest, gpsAddress: rest.gpsAddress ?? '' });
        toast({ title: 'Success', description: 'NSP record updated successfully.' });
      } else {
        await createNewNSP(firestore, { nssNumber, districtId: DISTRICT_ID, ...rest, gpsAddress: rest.gpsAddress ?? '' });
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

  const FormError = ({ name }: { name: keyof z.infer<typeof FormSchema> }) => {
    if (state.errors?.[name]) {
      return <p className="text-sm text-destructive mt-1">{state.errors[name]?.[0]}</p>;
    }
    return null;
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
        <CardContent className="space-y-6">
          
          {/* Personal Information Section */}
          <div>
            <h4 className="text-lg font-medium mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" name="surname" defaultValue={nsp?.surname} />
                <FormError name="surname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherNames">Other Names</Label>
                <Input id="otherNames" name="otherNames" defaultValue={nsp?.otherNames} />
                <FormError name="otherNames" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nssNumber">NSS Number</Label>
                <Input id="nssNumber" name="nssNumber" defaultValue={nsp?.nssNumber} />
                <FormError name="nssNumber" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" defaultValue={nsp?.gender}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                 <FormError name="gender" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div>
            <h4 className="text-lg font-medium mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" defaultValue={nsp?.email} />
                <FormError name="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={nsp?.phone} />
                <FormError name="phone" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="residentialAddress">Permanent Residential Address</Label>
                <Input id="residentialAddress" name="residentialAddress" defaultValue={nsp?.residentialAddress} />
                <FormError name="residentialAddress" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gpsAddress">GPS Address (Optional)</Label>
                <Input id="gpsAddress" name="gpsAddress" defaultValue={nsp?.gpsAddress} />
                <FormError name="gpsAddress" />
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Academic and Posting Information */}
           <div>
            <h4 className="text-lg font-medium mb-4">Academic & Posting Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="institution">Institution Attended</Label>
                    <Input id="institution" name="institution" defaultValue={nsp?.institution} />
                    <FormError name="institution" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="courseOfStudy">Course of Study</Label>
                    <Input id="courseOfStudy" name="courseOfStudy" defaultValue={nsp?.courseOfStudy} />
                    <FormError name="courseOfStudy" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="posting">Place of Service</Label>
                    <Input id="posting" name="posting" defaultValue={nsp?.posting} />
                    <FormError name="posting" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" name="region" defaultValue={nsp?.region} />
                    <FormError name="region" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input id="district" name="district" defaultValue={nsp?.district} />
                    <FormError name="district" />
                </div>
            </div>
          </div>

          <Separator />

          {/* Other Information */}
          <div>
             <h4 className="text-lg font-medium mb-4">Other Information</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="nextOfKinName">Name of Next of Kin</Label>
                    <Input id="nextOfKinName" name="nextOfKinName" defaultValue={nsp?.nextOfKinName} />
                    <FormError name="nextOfKinName" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="nextOfKinPhone">Contact of Next of Kin</Label>
                    <Input id="nextOfKinPhone" name="nextOfKinPhone" defaultValue={nsp?.nextOfKinPhone} />
                    <FormError name="nextOfKinPhone" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="isEmployed">Employment Status</Label>
                    <Select name="isEmployed" defaultValue={String(nsp?.isEmployed ?? false)}>
                        <SelectTrigger><SelectValue placeholder="Select employment status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormError name="isEmployed" />
                </div>
                {nsp && (
                    <div className="space-y-2">
                    <Label htmlFor="isDisabled">Record Status</Label>
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
            </div>
          </div>

           {state.message && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
             </Alert>
           )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 bg-muted/50 py-3 px-6">
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
