import type { NoData } from './no-data';

/** Promotions user coupons wallet list result schema exposed by Claw Router. */
export interface PromotionsUserCouponsWalletListResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
