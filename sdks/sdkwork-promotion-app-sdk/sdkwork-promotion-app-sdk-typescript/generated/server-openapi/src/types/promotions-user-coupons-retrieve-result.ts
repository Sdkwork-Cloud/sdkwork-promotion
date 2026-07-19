import type { NoData } from './no-data';

/** Promotions user coupons retrieve result schema exposed by Claw Router. */
export interface PromotionsUserCouponsRetrieveResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
