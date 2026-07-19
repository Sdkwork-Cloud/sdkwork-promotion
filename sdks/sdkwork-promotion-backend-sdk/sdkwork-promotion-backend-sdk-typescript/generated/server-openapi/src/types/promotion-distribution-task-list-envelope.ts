import type { PageInfo } from './page-info';
import type { PromotionDistributionTask } from './promotion-distribution-task';

export interface PromotionDistributionTaskListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
