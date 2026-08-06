export interface PromotionDistributionTask {
  id: string;
  stockId: string;
  offerId: string;
  taskNo: string;
  distributionType: string;
  requestedQuantity: string;
  succeededQuantity: string;
  failedQuantity: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  createdAt: string;
  completedAt?: string | null;
}
