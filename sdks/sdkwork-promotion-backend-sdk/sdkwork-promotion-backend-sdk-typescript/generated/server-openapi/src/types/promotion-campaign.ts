export interface PromotionCampaign {
  id: string;
  campaignNo: string;
  campaignCode?: string | null;
  displayName: string;
  description?: string | null;
  channelScope: string;
  audienceScope: string;
  startsAt: string;
  endsAt?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED' | 'ARCHIVED';
  version: string;
  updatedAt: string;
}
