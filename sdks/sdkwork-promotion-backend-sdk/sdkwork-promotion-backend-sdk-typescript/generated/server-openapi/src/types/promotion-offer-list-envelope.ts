import type { PageInfo } from './page-info';
import type { PromotionOffer } from './promotion-offer';

export interface PromotionOfferListEnvelope {
  code: 0;
  data: { items: PromotionOffer[]; pageInfo: PageInfo; };
  traceId: string;
}
