import type { PageInfo } from './page-info';
import type { PromotionCodeBatch } from './promotion-code-batch';

export interface PromotionCodeBatchListEnvelope {
  code: 0;
  data: { items: PromotionCodeBatch[]; pageInfo: PageInfo; };
  traceId: string;
}
