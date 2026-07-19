export interface PromotionUserCoupon {
  id: string;
  couponNo: string;
  stockId: string;
  offerId: string;
  ownerUserId: string;
  couponCode: string;
  status: number;
  claimedAt: string;
  validFrom: string;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}
