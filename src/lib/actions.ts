'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createNewNSP, updateNSP, createSubmission, checkServiceNumberUniqueness } from './data';

const FormSchema = z.object({
    id: z.string(),
    serviceNumber: z.string({ invalid_type_error: 'Please enter a service number.' }).min(1, 'Service number is required.'),
    fullName: z.string().min(1, 'Full name is required.'),
    institution: z.string().min(1, 'Institution is required.'),
    posting: z.string().min(1, 'Posting is required.'),
    status: z.enum(['active', 'inactive'])
});

const CreateNSP = FormSchema.omit({ id: true });
const UpdateNSP = FormSchema;

export type State = {
    errors?: {
        serviceNumber?: string[];
        fullName?: string[];
        institution?: string[];
        posting?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createNspAction(prevState: State, formData: FormData) {
    const validatedFields = CreateNSP.safeParse({
        serviceNumber: formData.get('serviceNumber'),
        fullName: formData.get('fullName'),
        institution: formData.get('institution'),
        posting: formData.get('posting'),
        status: formData.get('status') || 'active',
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create NSP.',
        };
    }
    
    const { serviceNumber, ...rest } = validatedFields.data;

    const isUnique = await checkServiceNumberUniqueness(serviceNumber);
    if (!isUnique) {
        return {
            errors: { serviceNumber: ['This service number is already in use.'] },
            message: 'Validation failed.'
        }
    }

    try {
        await createNewNSP({ serviceNumber, ...rest });
    } catch (error) {
        return { message: 'Database Error: Failed to Create NSP.' };
    }

    revalidatePath('/nsp');
    redirect('/nsp');
}

export async function updateNspAction(id: string, prevState: State, formData: FormData) {
    const validatedFields = UpdateNSP.safeParse({
        id: id,
        serviceNumber: formData.get('serviceNumber'),
        fullName: formData.get('fullName'),
        institution: formData.get('institution'),
        posting: formData.get('posting'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update NSP.',
        };
    }

    const { serviceNumber, ...rest } = validatedFields.data;

    const isUnique = await checkServiceNumberUniqueness(serviceNumber, id);
    if (!isUnique) {
        return {
            errors: { serviceNumber: ['This service number is already in use.'] },
            message: 'Validation failed.'
        }
    }

    try {
        await updateNSP(id, { serviceNumber, ...rest });
    } catch (error) {
        return { message: 'Database Error: Failed to Update NSP.' };
    }

    revalidatePath('/nsp');
    revalidatePath(`/nsp/${id}/edit`);
    redirect('/nsp');
}

export async function createSubmissionAction(nspId: string, formData: FormData) {
    try {
        const month = Number(formData.get('month'));
        const year = Number(formData.get('year'));
        const officerName = String(formData.get('officer'));

        if (!month || !year || !officerName) {
            return { success: false, error: 'Month, year, and officer name are required.' };
        }
        
        await createSubmission(nspId, month, year, officerName);
        revalidatePath('/nsp');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Database Error: Failed to create submission.' };
    }
}
