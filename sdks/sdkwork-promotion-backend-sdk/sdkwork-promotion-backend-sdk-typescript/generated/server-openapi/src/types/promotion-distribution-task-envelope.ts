import type { PromotionDistributionTask } from './promotion-distribution-task';

export interface PromotionDistributionTaskEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
