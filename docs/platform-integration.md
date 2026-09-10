# Platform integration contract

This module expects shared documents, not a second schema.

## Lot input
`lotId`, `collectorId`, `category`, `conditionAssessment`, `components`, `quantity`, `estimatedWeight`, `askingPrice`, `evidence`, `location`, `status`, `createdAt`, `updatedAt`.

## Recycler input
`recyclerId`, `verificationStatus`, `acceptedMaterials`, `processingCapabilities`, `capacity`, `location`.

The platform preserves the incoming `lotId` through offer, transaction, payment, handover, audit, QR, and timeline records. It does not create a replacement lot. Collector and recycler identity data remains behind Firebase authorization. The seeded records are demo-only assumptions for the hackathon; production integrations should provide authenticated Firestore documents and validated role claims.

The Collector module can create/list lots. The Recycler module can provide a profile and accept an offer. Platform services expose `priceReferences`, `offers`, `transactions`, `payments`, `handoverRecords`, `auditLogs`, and `safetyGuides` with the shared TypeScript types in `src/types/domain.ts`.
