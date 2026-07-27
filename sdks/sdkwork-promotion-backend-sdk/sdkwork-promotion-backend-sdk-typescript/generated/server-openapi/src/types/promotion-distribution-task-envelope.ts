import type { PromotionDistributionTask } from './promotion-distribution-task';

export interface PromotionDistributionTaskEnvelope {
  code: 0;
  data: { item: PromotionDistributionTask; };
  traceId: string;
}
