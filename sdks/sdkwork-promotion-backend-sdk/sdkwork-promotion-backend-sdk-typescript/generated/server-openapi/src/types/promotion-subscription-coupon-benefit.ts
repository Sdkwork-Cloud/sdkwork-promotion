export interface PromotionSubscriptionCouponBenefit {
  kind: 'subscription';
  productId: string;
  skuId: string;
  packageId: string;
  period: 'day' | 'week' | 'month' | 'year';
  durationDays: string;
  dailyQuota: string;
  totalQuota: string;
}
