export interface PromotionOffer {
  id: string;
  offerNo: string;
  offerCode?: string | null;
  offerType: string;
  displayName: string;
  description?: string | null;
  priority: number;
  startsAt: string;
  endsAt?: string | null;
  status: number;
  updatedAt: string;
}
