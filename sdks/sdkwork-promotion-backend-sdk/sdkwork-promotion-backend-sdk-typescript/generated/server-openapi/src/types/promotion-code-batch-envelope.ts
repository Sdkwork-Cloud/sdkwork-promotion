import type { PromotionCodeBatch } from './promotion-code-batch';

export interface PromotionCodeBatchEnvelope {
  code: 0;
  data: { item: PromotionCodeBatch; };
  traceId: string;
}
