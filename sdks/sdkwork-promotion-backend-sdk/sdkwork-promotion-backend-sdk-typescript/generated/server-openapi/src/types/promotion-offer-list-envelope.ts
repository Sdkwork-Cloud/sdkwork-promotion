import type { PageInfo } from './page-info';
import type { PromotionOffer } from './promotion-offer';

export interface PromotionOfferListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
