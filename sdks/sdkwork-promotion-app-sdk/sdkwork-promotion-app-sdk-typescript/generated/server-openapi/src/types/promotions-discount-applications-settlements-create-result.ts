import type { NoData } from './no-data';

/** Promotions discount applications settlements create result schema exposed by Claw Router. */
export interface PromotionsDiscountApplicationsSettlementsCreateResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
