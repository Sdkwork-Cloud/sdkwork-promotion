import type { DiscountApplication } from './discount-application';
import type { PageInfo } from './page-info';

export interface DiscountApplicationListEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
