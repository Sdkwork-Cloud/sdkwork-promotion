import type { PromotionCampaign } from './promotion-campaign';

export interface PromotionCampaignEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
