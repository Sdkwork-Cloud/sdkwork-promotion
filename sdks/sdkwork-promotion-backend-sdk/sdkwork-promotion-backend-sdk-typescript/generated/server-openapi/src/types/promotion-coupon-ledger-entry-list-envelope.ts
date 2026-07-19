import type { PageInfo } from './page-info';
import type { PromotionCouponLedgerEntry } from './promotion-coupon-ledger-entry';

export interface PromotionCouponLedgerEntryListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
