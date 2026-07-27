import type { PromotionSubscriptionCouponBenefit } from './promotion-subscription-coupon-benefit';
import type { PromotionTokenBankCouponBenefit } from './promotion-token-bank-coupon-benefit';

export type PromotionCouponBenefit = PromotionTokenBankCouponBenefit | PromotionSubscriptionCouponBenefit;
