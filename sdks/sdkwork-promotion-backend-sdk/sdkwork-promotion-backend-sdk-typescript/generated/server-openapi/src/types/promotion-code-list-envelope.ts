import type { PageInfo } from './page-info';
import type { PromotionCode } from './promotion-code';

export interface PromotionCodeListEnvelope {
  code: 0;
  data: { items: PromotionCode[]; pageInfo: PageInfo; };
  traceId: string;
}
