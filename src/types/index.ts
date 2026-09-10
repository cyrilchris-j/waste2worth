export * from './domain';

export type EWasteCategory =
  | 'LARGE_APPLIANCES'
  | 'SMALL_APPLIANCES'
  | 'IT_TELECOM'
  | 'CONSUMER_ELECTRONICS'
  | 'LIGHTING'
  | 'ELECTRICAL_TOOLS'
  | 'TOYS_LEISURE'
  | 'MEDICAL_DEVICES'
  | 'MONITORING_CONTROL'
  | 'AUTOMATIC_DISPENSERS'
  | 'BATTERIES'
  | 'SOLAR_PANELS'
  | 'OTHER'
  | string;

export type TransactionStatus =
  | 'INITIATED'
  | 'OFFER_ACCEPTED'
  | 'PAYMENT_ESCROWED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'HANDOVER_SCHEDULED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;
