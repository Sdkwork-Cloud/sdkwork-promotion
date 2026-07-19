import type { PromotionOffer } from './promotion-offer';

export interface PromotionOfferEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
