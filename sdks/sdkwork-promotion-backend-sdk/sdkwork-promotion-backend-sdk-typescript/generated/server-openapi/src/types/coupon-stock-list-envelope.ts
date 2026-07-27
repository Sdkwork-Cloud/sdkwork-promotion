import type { CouponStock } from './coupon-stock';
import type { PageInfo } from './page-info';

export interface CouponStockListEnvelope {
  code: 0;
  data: { items: CouponStock[]; pageInfo: PageInfo; };
  traceId: string;
}
