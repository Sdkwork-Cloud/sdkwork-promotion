export interface PromotionDistributionRequest {
  stockId: string;
  ownerUserIds: string[];
  idempotencyKey: string;
}
