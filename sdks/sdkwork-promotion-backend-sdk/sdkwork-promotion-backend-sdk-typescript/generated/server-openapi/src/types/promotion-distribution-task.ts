export interface PromotionDistributionTask {
  id: string;
  stockId: string;
  offerId: string;
  taskNo: string;
  distributionType: string;
  requestedQuantity: string;
  succeededQuantity: string;
  failedQuantity: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
}
