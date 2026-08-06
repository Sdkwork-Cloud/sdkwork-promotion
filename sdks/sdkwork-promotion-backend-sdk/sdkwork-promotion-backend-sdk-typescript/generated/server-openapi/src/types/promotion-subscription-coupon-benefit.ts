export interface PromotionSubscriptionCouponBenefit {
  kind: 'subscription';
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  durationDays: string;
  dailyQuota: string;
  totalQuota: string;
}
