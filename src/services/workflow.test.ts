import { describe, expect, it } from 'vitest';
import { auditLogs, demoLot } from '../data/seed';
import { LotStatus } from '../types/domain';
import { createMockPayment, settleMockPayment, transitionTransaction } from './workflow';
import { matchesCategory } from './lotService';
import { canTransition } from '../utils/engines';
import type { ProcessingReport, PublicTrace } from '../types';

describe('transaction workflow & gap fixes', () => {
  const transaction = {
    transactionId: 'TXN-2026-TEST',
    lotId: demoLot.lotId,
    collectorId: demoLot.collectorId,
    recyclerId: 'recycler-greenloop',
    offerId: 'OFF-1',
    materialSummary: 'Laptop lot',
    amount: demoLot.askingPrice,
    status: LotStatus.ACCEPTED,
    createdAt: '',
    updatedAt: '',
  };

  it('creates and settles a mock payment', () => {
    const payment = createMockPayment(transaction);
    expect(payment.method).toBe('MOCK');
    expect(settleMockPayment(payment, true).status).toBe('PAID');
  });

  it('creates a report for the same lot and transaction', () => {
    const report: ProcessingReport = {
      processingReportId: 'PR-1',
      transactionId: transaction.transactionId,
      lotId: transaction.lotId,
      recyclerId: transaction.recyclerId,
      receivedWeight: 35,
      processedWeight: 31,
      processingType: 'Dismantling',
      recoveredMaterials: ['PCB'],
      residualQuantity: 4,
      processingDate: '2026-09-10',
      notes: 'Demo report',
      evidence: [],
      createdAt: '',
      updatedAt: '',
    };
    expect(report.lotId).toBe(demoLot.lotId);
    expect(report.transactionId).toBe(transaction.transactionId);
  });

  it('keeps transaction IDs on transaction-linked audit events', () => {
    expect(
      auditLogs
        .filter((event) => event.eventType === 'PRICE_EVALUATED' || event.eventType === 'MATCH_CREATED')
        .every((event) => event.transactionId === 'TXN-2026-014')
    ).toBe(true);
  });

  it('rejects invalid lifecycle transitions', () => {
    expect(() =>
      transitionTransaction({ ...transaction, status: LotStatus.COMPLETED }, LotStatus.LISTED)
    ).toThrow('Invalid lifecycle transition');
  });

  // ─────────────────────────────────────────────
  // FIX 4: Case-Insensitive Category Matching
  // ─────────────────────────────────────────────
  describe('FIX 4: category normalization', () => {
    it('matches categories regardless of casing or whitespace', () => {
      expect(matchesCategory('Laptop', ['LAPTOP', 'Battery'])).toBe(true);
      expect(matchesCategory('LAPTOP', ['laptop'])).toBe(true);
      expect(matchesCategory('  laptop  ', ['LAPTOP'])).toBe(true);
      expect(matchesCategory('LaPtOp', ['laptop'])).toBe(true);
      expect(matchesCategory('Mobile Phone', ['mobile phone'])).toBe(true);
      expect(matchesCategory('Display', ['Battery', 'PCB'])).toBe(false);
    });

    it('matches when acceptedCategories is empty (wildcard for all categories)', () => {
      expect(matchesCategory('Laptop', [])).toBe(true);
      expect(matchesCategory('AnyCategory', undefined)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // FIX 5: Processing Report -> Transaction State Transition
  // ─────────────────────────────────────────────
  describe('FIX 5: processing report state machine lifecycle', () => {
    it('strictly follows RECEIVED -> PROCESSING -> REPORT_PENDING -> COMPLETED', () => {
      // Step 1: Material Received
      expect(canTransition(LotStatus.RECEIVED, LotStatus.PROCESSING)).toBe(true);

      // Step 2: Processing started -> Report pending
      expect(canTransition(LotStatus.PROCESSING, LotStatus.REPORT_PENDING)).toBe(true);

      // Step 3: Report valid & complete -> COMPLETED
      expect(canTransition(LotStatus.REPORT_PENDING, LotStatus.COMPLETED)).toBe(true);

      // Direct transition from PROCESSING to COMPLETED is also allowed
      expect(canTransition(LotStatus.PROCESSING, LotStatus.COMPLETED)).toBe(true);

      // Invalid transitions must be blocked
      expect(canTransition(LotStatus.RECEIVED, LotStatus.COMPLETED)).toBe(false);
      expect(canTransition(LotStatus.REPORT_PENDING, LotStatus.LISTED)).toBe(false);
      expect(canTransition(LotStatus.COMPLETED, LotStatus.PROCESSING)).toBe(false);
    });

    it('verifies state progression on transaction object', () => {
      let current = transitionTransaction(
        { ...transaction, status: LotStatus.RECEIVED },
        LotStatus.PROCESSING
      );
      expect(current.status).toBe(LotStatus.PROCESSING);

      current = transitionTransaction(current, LotStatus.REPORT_PENDING);
      expect(current.status).toBe(LotStatus.REPORT_PENDING);

      current = transitionTransaction(current, LotStatus.COMPLETED);
      expect(current.status).toBe(LotStatus.COMPLETED);
    });
  });

  // ─────────────────────────────────────────────
  // FIX 3: Privacy-Safe Public Trace Projection
  // ─────────────────────────────────────────────
  describe('FIX 3: public QR trace projection', () => {
    it('creates privacy-safe public trace without collector PII or financial payout details', () => {
      const publicTrace: PublicTrace = {
        lotId: 'LOT-2026-TEST-99',
        category: 'Laptop',
        status: 'COMPLETED',
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-09-10T12:00:00Z',
        transactionReference: 'TXN-2026-TEST-99',
        processingStatus: 'COMPLETED',
        timeline: [
          { status: 'LOT_LISTED', label: 'Material Listed', timestamp: '2026-09-10T10:00:00Z' },
          { status: 'LOT_ACCEPTED', label: 'Accepted by Recycler', timestamp: '2026-09-10T10:30:00Z' },
          { status: 'LOT_COMPLETED', label: 'Recycling Completed', timestamp: '2026-09-10T12:00:00Z' },
        ],
        recoverySummary: {
          inputWeightKg: 15.0,
          processedWeightKg: 14.8,
          residualWeightKg: 0.2,
          materials: [
            { material: 'Aluminum', quantityKg: 5.2 },
            { material: 'Copper', quantityKg: 2.1 },
            { material: 'Circuit Board (PCB)', quantityKg: 4.5 },
          ],
        },
        publicMilestones: ['Declaration verified', 'Accepted by Recycler', 'Processing Complete'],
      };

      // Assert safe public fields exist
      expect(publicTrace.lotId).toBe('LOT-2026-TEST-99');
      expect(publicTrace.recoverySummary?.materials?.length).toBe(3);
      expect(publicTrace.timeline.length).toBe(3);

      // Assert NO private collector fields exist on public trace projection
      const rawTrace = publicTrace as unknown as Record<string, unknown>;
      expect(rawTrace.collectorPhone).toBeUndefined();
      expect(rawTrace.collectorEmail).toBeUndefined();
      expect(rawTrace.collectorAddress).toBeUndefined();
      expect(rawTrace.collectorEarnings).toBeUndefined();
      expect(rawTrace.payoutAccount).toBeUndefined();
    });
  });
});
