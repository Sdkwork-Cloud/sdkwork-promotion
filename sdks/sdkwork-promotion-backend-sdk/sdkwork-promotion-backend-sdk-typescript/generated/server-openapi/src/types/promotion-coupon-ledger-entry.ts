export interface PromotionCouponLedgerEntry {
  id: string;
  stockId: string;
  userCouponId?: string | null;
  offerId: string;
  subjectId?: string | null;
  direction: string;
  quantityDelta: string;
  balanceAfter: string;
  businessType: string;
  businessNo: string;
  createdAt: string;
}
