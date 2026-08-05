import type { PromotionCashCouponBenefit } from './promotion-cash-coupon-benefit';
import type { PromotionPointsCouponBenefit } from './promotion-points-coupon-benefit';
import type { PromotionSubscriptionCouponBenefit } from './promotion-subscription-coupon-benefit';
import type { PromotionTokenBankCouponBenefit } from './promotion-token-bank-coupon-benefit';

export type PromotionCouponBenefit = PromotionTokenBankCouponBenefit | PromotionPointsCouponBenefit | PromotionCashCouponBenefit | PromotionSubscriptionCouponBenefit;
