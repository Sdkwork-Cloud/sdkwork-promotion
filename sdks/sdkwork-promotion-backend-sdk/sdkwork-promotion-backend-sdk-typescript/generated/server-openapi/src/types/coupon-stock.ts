export interface CouponStock {
  id: string;
  offerId: string;
  stockNo: string;
  stockType: string;
  totalQuantity: string;
  availableQuantity: string;
  claimedQuantity: string;
  redeemedQuantity: string;
  lockedQuantity: string;
  perUserLimit: number;
  claimStartsAt?: string | null;
  claimEndsAt?: string | null;
  status: number;
}
