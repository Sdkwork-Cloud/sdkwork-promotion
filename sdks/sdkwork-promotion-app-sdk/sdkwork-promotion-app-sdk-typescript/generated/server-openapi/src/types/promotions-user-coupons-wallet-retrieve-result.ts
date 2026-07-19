import type { NoData } from './no-data';

/** Promotions user coupons wallet retrieve result schema exposed by Claw Router. */
export interface PromotionsUserCouponsWalletRetrieveResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
