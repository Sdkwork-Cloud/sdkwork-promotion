import type { NoData } from './no-data';

/** Promotions user coupons claims create result schema exposed by Claw Router. */
export interface PromotionsUserCouponsClaimsCreateResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
