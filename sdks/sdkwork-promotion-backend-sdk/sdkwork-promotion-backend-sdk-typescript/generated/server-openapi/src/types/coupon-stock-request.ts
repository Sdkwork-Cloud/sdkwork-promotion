export interface CouponStockRequest {
  offerId: string;
  stockType: 'limited' | 'unlimited';
  /** Total quantity. Must be positive for LIMITED stock; 0 allowed for UNLIMITED stock (statistics only) */
  totalQuantity: string;
  perUserLimit: number;
  claimStartsAt?: string | null;
  claimEndsAt?: string | null;
  status: 'active' | 'disabled';
  /** Coupon code issuance mode: REALTIME generates a code at claim time; BATCH dispenses a pre-generated pool code */
  codeIssueMode?: 'realtime' | 'batch';
}
