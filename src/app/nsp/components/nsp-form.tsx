'use client';
import { useActionState } from 'react';
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
import { type State, createNspAction, updateNspAction } from '@/lib/actions';
import { SubmitFormButton } from './submit-form-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function NSPForm({ nsp }: { nsp?: NSP }) {
  const initialState: State = { message: null, errors: {} };
  const actionToRun = nsp ? updateNspAction.bind(null, nsp.id) : createNspAction;
  const [state, dispatch] = useActionState(actionToRun, initialState);

  return (
    <form action={dispatch}>
      <Card>
        <CardHeader>
          <CardTitle>{nsp ? 'Edit NSP Record' : 'Create New NSP Record'}</CardTitle>
          <CardDescription>
            {nsp ? `Editing details for ${nsp.fullName} (${nsp.id}).` : 'Fill in the details below to add a new person.'}
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
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={nsp.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
            <Button variant="outline">Cancel</Button>
          </Link>
          <SubmitFormButton />
        </CardFooter>
      </Card>
    </form>
  );
}
