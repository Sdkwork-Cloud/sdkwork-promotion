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
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled' | 'archived';
  version: string;
  updatedAt: string;
}
