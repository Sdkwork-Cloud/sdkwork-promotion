import type { PromotionOverview } from './promotion-overview';

export interface PromotionOverviewEnvelope {
  code: 0;
  data: unknown & Record<string, unknown>;
  traceId: string;
}
