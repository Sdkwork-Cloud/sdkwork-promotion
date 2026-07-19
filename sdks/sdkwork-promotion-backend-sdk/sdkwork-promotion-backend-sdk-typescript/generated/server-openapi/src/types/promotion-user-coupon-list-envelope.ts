import type { PageInfo } from './page-info';
import type { PromotionUserCoupon } from './promotion-user-coupon';

export interface PromotionUserCouponListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
