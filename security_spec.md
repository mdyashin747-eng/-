# Security Specification — Seba Foundation Firestore

## 1. Data Invariants
1. **PII Isolation**: Donor `phone` numbers, full `trxId`, `note`, and volunteer `phone` numbers MUST never be readable (`get` or `list`) by public or non-admin users. Only the verified foundation admin (`mdyashin747@gmail.com` with `email_verified == true` or document in `/admins/{uid}`) can read/list `/donations` and `/volunteers`.
2. **Atomic Transparency Sync**: Every donation `create` in `/donations/{donationId}` MUST atomically create its stripped counterpart `/publicDonations/{donationId}` in the same `WriteBatch` (enforced via `existsAfter`).
3. **Initial State Lock**: Public creates on `/donations`, `/publicDonations`, and `/volunteers` MUST set `status == 'pending'`. Only verified admins can transition status (`verified`, `rejected`, `contacted`, `approved`).
4. **Temporal Integrity**: `createdAt` MUST equal `request.time` on create and remain immutable on update. `updatedAt` MUST equal `request.time` on update.
5. **Path ID Hardening**: All document IDs (`donationId`, `volunteerId`) MUST match `^[a-zA-Z0-9_-]+$` and be `<= 128` chars.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. Public `get` or `list` on `/donations` (PII phone & TrxID leak attempt).
2. Public `get` or `list` on `/volunteers` (PII phone leak attempt).
3. Unverified email spoofing `request.auth.token.email == 'mdyashin747@gmail.com'` with `email_verified == false` reading `/donations`.
4. Donation `create` with `status: 'verified'` (Status shortcutting).
5. Donation `create` with ghost field `isAdmin: true` (Shadow field injection).
6. Donation `create` with `amount: -500` or `amount: 99999999999` (Amount boundary bypass).
7. Donation `create` with `phone: '123'` or 1MB string (Resource exhaustion / invalid phone).
8. Donation `create` without atomic `/publicDonations/{donationId}` sibling write.
9. PublicDonation `create` containing a `phone` field (PII injection into public collection).
10. Non-admin `update` or `delete` on `/donations/{donationId}` or `/publicDonations/{donationId}`.
11. Admin `update` mutating immutable `createdAt` or `amount` or `trxId` or `phone`.
12. Path ID poisoning with 200+ char document ID or special characters on `/donations/{donationId}`.
