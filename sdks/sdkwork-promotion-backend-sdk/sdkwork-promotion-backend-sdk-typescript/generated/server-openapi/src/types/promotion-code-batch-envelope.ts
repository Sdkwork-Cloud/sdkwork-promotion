import type { PromotionCodeBatch } from './promotion-code-batch';

export interface PromotionCodeBatchEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
