export interface PromotionCodeBatch {
  id: string;
  stockId: string;
  offerId: string;
  batchNo: string;
  codeType: string;
  requestedQuantity: string;
  generatedQuantity: string;
  codeLength: number;
  codePrefix: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  status: string;
  createdAt: string;
}
