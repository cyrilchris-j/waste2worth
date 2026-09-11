# Platform integration contract

This module expects shared documents, not a second schema.

## Lot input
`lotId`, `collectorId`, `category`, `conditionAssessment`, `components`, `quantity`, `estimatedWeight`, `askingPrice`, `evidence`, `location`, `status`, `createdAt`, `updatedAt`.

## Recycler input
`recyclerId`, `verificationStatus`, `acceptedMaterials`, `processingCapabilities`, `capacity`, `location`.

The platform preserves the incoming `lotId` through offer, transaction, payment, handover, audit, QR, and timeline records. It does not create a replacement lot. Collector and recycler identity data remains behind Firebase authorization. The seeded records are demo-only assumptions for the hackathon; production integrations should provide authenticated Firestore documents and validated role claims.

The Collector module can create/list lots. The Recycler module can provide a profile and accept an offer. Platform services use the exact Firestore collections `users`, `collectorProfiles`, `recyclerProfiles`, `lots`, `offers`, `priceReferences`, `transactions`, `payments`, `handoverRecords`, `processingReports`, `auditLogs`, and `safetyGuides` with shared TypeScript types in `src/types/domain.ts`.

Processing reports preserve the same `lotId` and `transactionId` and add `processingReportId`; they do not create a new lot. Transaction-linked audit events carry the same transaction ID, while pre-transaction lot events use `transactionId: null`.

The QR route is implemented at `/trace/:lotId` and accepts the transaction query parameter. It currently resolves the seeded demo lot and shows a safe public summary. Production trace lookup should replace the demo lookup with an authorized public projection.
