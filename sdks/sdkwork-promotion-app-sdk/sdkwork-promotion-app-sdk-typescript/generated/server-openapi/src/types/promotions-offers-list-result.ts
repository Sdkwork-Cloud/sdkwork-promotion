import type { NoData } from './no-data';

/** Promotions offers list result schema exposed by Claw Router. */
export interface PromotionsOffersListResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
