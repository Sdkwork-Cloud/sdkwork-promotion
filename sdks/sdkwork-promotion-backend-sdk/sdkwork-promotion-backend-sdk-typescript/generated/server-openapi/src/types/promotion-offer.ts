import type { PromotionCouponBenefit } from './promotion-coupon-benefit';

export interface PromotionOffer {
  id: string;
  offerNo: string;
  offerCode?: string | null;
  offerType: string;
  audienceScope: string;
  combinability: string;
  goodsScope: string;
  displayName: string;
  description?: string | null;
  priority: number;
  startsAt: string;
  endsAt?: string | null;
  status: 'active' | 'disabled';
  updatedAt: string;
  campaignId?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  minimumAmount?: string | null;
  maximumDiscountAmount?: string | null;
  currencyCode?: string | null;
  couponBenefit?: PromotionCouponBenefit | null;
  version: string;
}
