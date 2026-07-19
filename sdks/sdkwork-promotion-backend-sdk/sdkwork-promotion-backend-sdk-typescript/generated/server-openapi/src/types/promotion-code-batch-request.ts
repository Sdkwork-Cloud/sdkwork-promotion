export interface PromotionCodeBatchRequest {
  stockId: string;
  codeType: string;
  quantity: string;
  codeLength: number;
  codePrefix: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  idempotencyKey: string;
}
