export interface PromotionOfferRequest {
  campaignId?: string | null;
  offerCode?: string | null;
  offerType: string;
  displayName: string;
  description?: string | null;
  audienceScope: string;
  combinability: string;
  goodsScope: string;
  priority: number;
  startsAt: string;
  endsAt?: string | null;
  status: 0 | 1;
  discountType: string;
  discountValue: string;
  minimumAmount: string;
  maximumDiscountAmount?: string | null;
  currencyCode: string;
  version?: string | null;
}
