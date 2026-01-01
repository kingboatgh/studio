// This file should be imported by 'use server' modules
import { initializeFirebase } from '@/firebase';
import { 
    fetchNsps as _fetchNsps,
    fetchNspById as _fetchNspById,
    getDashboardStats as _getDashboardStats,
    createNewNSP as _createNewNSP,
    updateNSP as _updateNSP,
    createSubmission as _createSubmission,
    checkServiceNumberUniqueness as _checkServiceNumberUniqueness
} from './data';
import type { NSP } from './definitions';
import type { Firestore } from 'firebase/firestore';

async function getDb(): Promise<Firestore> {
    const { firestore } = initializeFirebase();
    return firestore;
}

export async function fetchNsps(queryString?: string, page: number = 1) {
    const db = await getDb();
    return _fetchNsps(db, queryString, page);
}

export async function fetchNspById(id: string) {
    const db = await getDb();
    return _fetchNspById(db, id);
}

export async function getDashboardStats() {
    const db = await getDb();
    return _getDashboardStats(db);
}

export async function createNewNSP(data: Omit<NSP, 'id' | 'createdDate' | 'lastUpdatedDate' | 'serviceYear'> & { districtId: string }) {
    const db = await getDb();
    return _createNewNSP(db, data);
}

export async function updateNSP(id: string, data: Partial<Omit<NSP, 'id'>>) {
    const db = await getDb();
    return _updateNSP(db, id, data);
}

export async function createSubmission(districtId: string, nspId: string, month: number, year: number, officerName: string) {
    const db = await getDb();
    return _createSubmission(db, districtId, nspId, month, year, officerName);
}

export async function checkServiceNumberUniqueness(serviceNumber: string, currentNspId?: string) {
    const db = await getDb();
    return _checkServiceNumberUniqueness(db, serviceNumber, currentNspId);
}
