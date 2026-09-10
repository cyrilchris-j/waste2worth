# Collector Integration Contract

This document is the handoff contract for the Collector module. The implementation uses the shared Firebase collections `users`, `collectorProfiles`, and `lots`.

## Authentication and profiles

Collector registration uses Firebase Authentication email/password when Firebase environment variables are configured. The authenticated Firebase UID is the `userId` and `collectorId`; no second identifier is generated. A user document is written to `users/{collectorId}` with `role: "COLLECTOR"`, `email`, and `fullName`. The profile is written to `collectorProfiles/{collectorId}`.

`collectorProfiles` fields:

```text
collectorId, fullName, phone, email, location, collectorType,
organization, termsAccepted, participationTermsAccepted, status,
createdAt, totalLots, completedLots, earnings
```

## Lot contract

Lots are written to `lots/{lotId}`. The same generated `lotId` is retained through every status transition.

```text
lotId, clientOperationId, collectorId, category,
conditionAssessment, components, quantity, estimatedWeight, unit,
askingPrice, evidence, location, status, createdAt, updatedAt, notes
```

`conditionAssessment` is structured (`working`, `physicalDamage`, `waterDamage`, `batteryCondition`, `missingComponents`, `brokenDisplay`, `otherDefects`). `components` contains `present`, `missing`, `reusable`, and `hazardous` declarations.

Supported `status` values are `DRAFT`, `LISTED`, `ACCEPTED`, `PAID`, `HANDED_OVER`, `RECEIVED`, `PROCESSING`, `COMPLETED`, `CANCELLED`, and `DISPUTED`. A completed declaration starts as `DRAFT` when saved as a draft and becomes `LISTED` only when the collector explicitly selects **List this lot**.

## Evidence

Original images are uploaded to Firebase Storage at `lots/{collectorId}/{lotId}/{evidenceId}-{fileName}`. The Firestore lot stores only evidence metadata and the Storage `storagePath` / `downloadUrl`. In offline demo mode, a data URL is retained locally so the collector does not lose evidence before reconnecting. Production deployments should apply a client-side image resizer before Storage upload.

## Offline synchronization

The UI caches profiles, drafts, and lots in local storage and enables Firestore multi-tab IndexedDB persistence when Firebase is configured. Offline lots use `syncStatus: PENDING_SYNC`; reconnect sets `SYNCING`, writes with `setDoc(lots/{lotId})`, then records `SYNCED`. Failed writes become `SYNC_ERROR` and remain queued for retry. `clientOperationId` equals `lotId`, and `setDoc` makes retries idempotent, preventing duplicate lot documents.

## Integration notes

- Cyril can rely on `collectorId`, `lotId`, `category`, `conditionAssessment`, `components`, `evidence`, `status`, and timestamps.
- Prasanna can evaluate `askingPrice` without replacing the collector declaration.
- Partner status updates must preserve `lotId` and write the shared status vocabulary.
- Security rules restrict users, profiles, lots, and evidence paths to the authenticated collector owner.