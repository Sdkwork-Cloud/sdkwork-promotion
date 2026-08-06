export interface CouponStock {
  id: string;
  offerId: string;
  stockNo: string;
  stockType: 'limited' | 'unlimited';
  totalQuantity: string;
  availableQuantity: string;
  claimedQuantity: string;
  redeemedQuantity: string;
  lockedQuantity: string;
  perUserLimit: number;
  claimStartsAt?: string | null;
  claimEndsAt?: string | null;
  status: 'active' | 'disabled';
  codeIssueMode: 'realtime' | 'batch';
}
