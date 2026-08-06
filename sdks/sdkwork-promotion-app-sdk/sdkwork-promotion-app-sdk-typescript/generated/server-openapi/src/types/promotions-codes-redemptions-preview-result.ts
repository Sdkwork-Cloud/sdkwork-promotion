import type { NoData } from './no-data';

/** Promotions codes redemptions preview result schema exposed by Cloud Router. */
export interface PromotionsCodesRedemptionsPreviewResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
