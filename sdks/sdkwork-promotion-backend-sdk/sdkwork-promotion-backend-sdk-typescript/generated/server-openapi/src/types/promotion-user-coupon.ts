export interface PromotionUserCoupon {
  id: string;
  couponNo: string;
  stockId: string;
  offerId: string;
  ownerUserId: string;
  couponCode: string;
  status: 'claimed' | 'redeemed' | 'expired' | 'disabled' | 'voided' | 'cancelled';
  claimedAt: string;
  validFrom: string;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}
