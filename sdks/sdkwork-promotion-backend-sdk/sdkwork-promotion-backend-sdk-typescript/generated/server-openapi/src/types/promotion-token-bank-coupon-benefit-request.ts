export interface PromotionTokenBankCouponBenefitRequest {
  kind: 'token_bank_credit';
  grantAmount: string;
  bonusAmount?: string;
}
