import type { CouponStock } from './coupon-stock';

export interface CouponStockEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
