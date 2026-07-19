import type { PageInfo } from './page-info';
import type { PromotionCampaign } from './promotion-campaign';

export interface PromotionCampaignListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
