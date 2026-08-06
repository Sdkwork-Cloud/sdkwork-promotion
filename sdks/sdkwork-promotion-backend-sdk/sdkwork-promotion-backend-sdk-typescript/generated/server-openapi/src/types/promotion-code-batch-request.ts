export interface PromotionCodeBatchRequest {
  stockId: string;
  codeType: string;
  codeLength: number;
  codePrefix: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  idempotencyKey: string;
  requestedQuantity: string;
}
