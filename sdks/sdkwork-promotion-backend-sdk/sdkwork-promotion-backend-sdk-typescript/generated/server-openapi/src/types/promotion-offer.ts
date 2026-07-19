export interface PromotionOffer {
  id: string;
  offerNo: string;
  offerCode?: string | null;
  offerType: string;
  displayName: string;
  description?: string | null;
  priority: number;
  startsAt: string;
  endsAt?: string | null;
  status: number;
  updatedAt: string;
  campaignId?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  minimumAmount?: string | null;
  maximumDiscountAmount?: string | null;
  currencyCode?: string | null;
  version: string;
}
