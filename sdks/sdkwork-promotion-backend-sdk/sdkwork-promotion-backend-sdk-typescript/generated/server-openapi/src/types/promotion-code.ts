export interface PromotionCode {
  id: string;
  stockId: string;
  offerId: string;
  codeNo: string;
  promotionCode: string;
  codeType: string;
  maxClaims: number;
  claimedQuantity: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  status: number;
}
