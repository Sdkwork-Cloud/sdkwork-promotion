import type { PromotionOffer } from './promotion-offer';

export interface PromotionOfferEnvelope {
  code: 0;
  data: { item: PromotionOffer; };
  traceId: string;
}
