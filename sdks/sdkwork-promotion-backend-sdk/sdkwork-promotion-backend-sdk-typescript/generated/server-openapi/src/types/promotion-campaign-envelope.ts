import type { PromotionCampaign } from './promotion-campaign';

export interface PromotionCampaignEnvelope {
  code: 0;
  data: { item: PromotionCampaign; };
  traceId: string;
}
