import type { CouponStock } from './coupon-stock';

export interface CouponStockEnvelope {
  code: 0;
  data: { item: CouponStock; };
  traceId: string;
}
