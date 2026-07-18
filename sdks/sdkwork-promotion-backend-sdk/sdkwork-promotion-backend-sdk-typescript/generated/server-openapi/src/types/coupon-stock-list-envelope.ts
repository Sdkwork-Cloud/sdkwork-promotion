import type { CouponStock } from './coupon-stock';
import type { PageInfo } from './page-info';

export interface CouponStockListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
