import type { NoData } from './no-data';

/** Promotions discount applications create result schema exposed by Claw Router. */
export interface PromotionsDiscountApplicationsCreateResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
