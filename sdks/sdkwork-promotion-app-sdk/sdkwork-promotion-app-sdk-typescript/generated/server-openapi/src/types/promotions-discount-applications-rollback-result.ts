import type { NoData } from './no-data';

/** Promotions discount applications rollback result schema exposed by Claw Router. */
export interface PromotionsDiscountApplicationsRollbackResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
