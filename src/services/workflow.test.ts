import { describe, expect, it } from 'vitest'
import { demoLot } from '../data/seed'
import { LotStatus } from '../types/domain'
import { createMockPayment, settleMockPayment, transitionTransaction } from './workflow'
describe('transaction workflow', () => { const transaction = { transactionId:'TXN-1', lotId:demoLot.lotId, collectorId:demoLot.collectorId, recyclerId:'recycler-greenloop', offerId:'OFF-1', materialSummary:'Laptop lot', amount:demoLot.askingPrice, status:LotStatus.ACCEPTED, createdAt:'', updatedAt:'' }; it('creates and settles a mock payment', () => { const payment=createMockPayment(transaction); expect(payment.method).toBe('MOCK'); expect(settleMockPayment(payment,true).status).toBe('PAID') }); it('rejects invalid lifecycle transitions', () => { expect(() => transitionTransaction({...transaction,status:LotStatus.COMPLETED},LotStatus.LISTED)).toThrow('Invalid lifecycle transition') }) })
