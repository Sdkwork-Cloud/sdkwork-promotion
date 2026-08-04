export interface DiscountApplication {
  id: string;
  applicationNo: string;
  orderId: string;
  orderNo?: string | null;
  offerId: string;
  discountType: string;
  discountAmount: string;
  currencyCode: string;
  status: 'applied' | 'settled' | 'released' | 'rolled_back';
  appliedAt: string;
  settledAt?: string | null;
  releasedAt?: string | null;
  rolledBackAt?: string | null;
}
