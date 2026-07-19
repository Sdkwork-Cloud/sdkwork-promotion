import type { NoData } from './no-data';

/** Promotions user coupons list result schema exposed by Claw Router. */
export interface PromotionsUserCouponsListResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
