export interface CouponStockRequest {
  offerId: string;
  stockType: 'LIMITED' | 'UNLIMITED';
  totalQuantity: string;
  perUserLimit: number;
  claimStartsAt?: string | null;
  claimEndsAt?: string | null;
  status: 0 | 1;
}
