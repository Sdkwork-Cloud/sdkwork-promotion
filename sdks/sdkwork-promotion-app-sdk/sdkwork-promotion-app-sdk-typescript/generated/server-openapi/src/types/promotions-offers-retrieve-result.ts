import type { NoData } from './no-data';

/** Promotions offers retrieve result schema exposed by Claw Router. */
export interface PromotionsOffersRetrieveResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
