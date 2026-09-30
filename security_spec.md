# Security Specification

## 1. Data Invariants
- `Member`: A member can only update their own profile unless they are an OB or Developer.
- `Competition`: New contests can only be created by OBs or Developers.
- `Submission`: Users can only submit for themselves. OBs can mark submissions (add marks).
- `BookReview`: Users can only add book reviews for themselves.
- `Notice/Record`: Only OBs/Developers can create/update.
- `Finance`: Only Finance Managers can update financial records.

## 2. Dirty Dozen Payloads (Security Tests)
1.  **Public Write:** Unauthenticated user creating a notice.
2.  **Role Spoofing:** Member updating their own role to 'SECRETARY'.
3.  **PII Theft:** Authenticated member reading another member's profile.
4.  **Shadow Update:** Member updating a profile with a 'isDeveloper' field.
5.  **Illegal Contest Creation:** Member creating a competition.
6.  **Orphaned Submission:** Creating a submission for a non-existent competition ID.
7.  **Grade Inflation:** Member updating their own mark on a submission.
8.  **Terminal State Violation:** Updating a closed competition.
9.  **Timestamp Spoofing:** Updating a record with a client-provided `createdAt`.
10. **ID Poisoning:** Injecting a 5KB string as a competition ID.
11. **Finance Spoofing:** Member updating ExpenseRecord amounts.
12. **Book Challenge Hijack:** Member modifying BookChallengeConfig settings.

## 3. Test Plan (`firestore.rules.test.ts`)
- [ ] Initialize Firebase Admin for testing.
- [ ] For each payload, simulate `db.collection(...).add(...)` or `update(...)`.
- [ ] Assert `PERMISSION_DENIED`.
