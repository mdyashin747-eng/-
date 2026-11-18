import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  CampaignCategory,
  DonationRecord,
  PaymentMethod,
  VolunteerRecord,
  normalizeDigits,
} from '../data/foundation';

export interface AdminDonationItem {
  id: string;
  receiptNo: string;
  donorName: string;
  phone: string;
  campaignId: CampaignCategory;
  campaignTitle: string;
  amount: number;
  method: PaymentMethod;
  trxId: string;
  note?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAtMs: number;
  createdAtLabel: string;
}

export interface AdminVolunteerItem {
  id: string;
  name: string;
  phone: string;
  district: string;
  focusArea: string;
  status: 'pending' | 'contacted' | 'approved';
  createdAtMs: number;
  createdAtLabel: string;
}

function maskTrxId(trx: string): string {
  const clean = trx.trim();
  if (clean.length <= 6) {
    return `${clean.slice(0, 2)}***${clean.slice(-1)}`;
  }
  return `${clean.slice(0, 3)}***${clean.slice(-3)}`;
}

function formatTimestampBn(ts: unknown): { ms: number; label: string } {
  if (ts instanceof Timestamp) {
    const date = ts.toDate();
    const label = new Intl.DateTimeFormat('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
    return { ms: date.getTime(), label };
  }
  return { ms: Date.now(), label: 'এইমাত্র' };
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export async function submitDonationToFirestore(input: {
  donorName: string;
  phone: string;
  campaignId: CampaignCategory;
  campaignTitle: string;
  amount: number;
  method: PaymentMethod;
  trxId: string;
  note?: string;
}): Promise<DonationRecord> {
  const id = makeDocId('don');
  const suffix = String(Date.now()).slice(-4);
  const receiptNo = `SF-2026-${suffix}`;
  const cleanPhone = normalizeDigits(input.phone).replace(/\D/g, '').slice(0, 11);
  const cleanName = input.donorName.trim().slice(0, 80);
  const cleanTrx = input.trxId.trim().toUpperCase().slice(0, 40);
  const cleanCampaignTitle = input.campaignTitle.trim().slice(0, 80);
  const cleanNote = input.note?.trim().slice(0, 300);

  const privateDocData: Record<string, unknown> = {
    receiptNo,
    donorName: cleanName,
    phone: cleanPhone,
    campaignId: input.campaignId,
    campaignTitle: cleanCampaignTitle,
    amount: Math.round(input.amount),
    method: input.method,
    trxId: cleanTrx,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  if (cleanNote) {
    privateDocData.note = cleanNote;
  }

  const publicDocData = {
    receiptNo,
    displayName: cleanName,
    campaignId: input.campaignId,
    campaignTitle: cleanCampaignTitle,
    amount: Math.round(input.amount),
    method: input.method,
    maskedTrxId: maskTrxId(cleanTrx),
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'donations', id), privateDocData);
  batch.set(doc(db, 'publicDonations', id), publicDocData);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `donations/${id}`);
  }

  return {
    id,
    receiptNo,
    donorName: cleanName,
    phone: cleanPhone,
    campaignId: input.campaignId,
    campaignTitle: cleanCampaignTitle,
    amount: Math.round(input.amount),
    method: input.method,
    trxId: cleanTrx,
    note: cleanNote,
    createdAt: 'এইমাত্র',
    isNew: true,
  };
}

export async function submitVolunteerToFirestore(input: {
  name: string;
  phone: string;
  district: string;
  focusArea: string;
}): Promise<VolunteerRecord> {
  const id = makeDocId('vol');
  const cleanName = input.name.trim().slice(0, 80);
  const cleanPhone = normalizeDigits(input.phone).replace(/\D/g, '').slice(0, 11);
  const cleanDistrict = input.district.trim().slice(0, 40);
  const cleanFocus = input.focusArea.trim().slice(0, 80);

  try {
    await setDoc(doc(db, 'volunteers', id), {
      name: cleanName,
      phone: cleanPhone,
      district: cleanDistrict,
      focusArea: cleanFocus,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `volunteers/${id}`);
  }

  return {
    id,
    name: cleanName,
    phone: cleanPhone,
    district: cleanDistrict,
    focusArea: cleanFocus,
    joinedAt: 'এইমাত্র',
  };
}

export function subscribePublicDonations(
  onData: (items: DonationRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'publicDonations';
  const q = query(
    collection(db, path),
    where('status', 'in', ['pending', 'verified']),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const ts = formatTimestampBn(d.createdAt);
        return {
          ms: ts.ms,
          record: {
            id: docSnap.id,
            receiptNo: String(d.receiptNo ?? ''),
            donorName: String(d.displayName ?? 'নাম প্রকাশে অনিচ্ছুক'),
            phone: '',
            campaignId: (d.campaignId as CampaignCategory) ?? 'general',
            campaignTitle: String(d.campaignTitle ?? ''),
            amount: Number(d.amount ?? 0),
            method: (d.method as PaymentMethod) ?? 'bkash',
            trxId: String(d.maskedTrxId ?? '***'),
            createdAt: ts.label,
            isNew: true,
          } satisfies DonationRecord,
        };
      });
      parsed.sort((a, b) => b.ms - a.ms);
      onData(parsed.map((p) => p.record));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeAdminDonations(
  onData: (items: AdminDonationItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'donations';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminDonationItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const ts = formatTimestampBn(d.createdAt);
        return {
          id: docSnap.id,
          receiptNo: String(d.receiptNo ?? ''),
          donorName: String(d.donorName ?? ''),
          phone: String(d.phone ?? ''),
          campaignId: (d.campaignId as CampaignCategory) ?? 'general',
          campaignTitle: String(d.campaignTitle ?? ''),
          amount: Number(d.amount ?? 0),
          method: (d.method as PaymentMethod) ?? 'bkash',
          trxId: String(d.trxId ?? ''),
          note: d.note ? String(d.note) : undefined,
          status: (d.status as AdminDonationItem['status']) ?? 'pending',
          createdAtMs: ts.ms,
          createdAtLabel: ts.label,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeAdminVolunteers(
  onData: (items: AdminVolunteerItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'volunteers';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminVolunteerItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const ts = formatTimestampBn(d.createdAt);
        return {
          id: docSnap.id,
          name: String(d.name ?? ''),
          phone: String(d.phone ?? ''),
          district: String(d.district ?? ''),
          focusArea: String(d.focusArea ?? ''),
          status: (d.status as AdminVolunteerItem['status']) ?? 'pending',
          createdAtMs: ts.ms,
          createdAtLabel: ts.label,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function updateDonationStatus(
  donationId: string,
  status: 'pending' | 'verified' | 'rejected'
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'donations', donationId), {
    status,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'publicDonations', donationId), {
    status,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `donations/${donationId}`);
  }
}

export async function updateVolunteerStatus(
  volunteerId: string,
  status: 'pending' | 'contacted' | 'approved'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'volunteers', volunteerId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `volunteers/${volunteerId}`);
  }
}
