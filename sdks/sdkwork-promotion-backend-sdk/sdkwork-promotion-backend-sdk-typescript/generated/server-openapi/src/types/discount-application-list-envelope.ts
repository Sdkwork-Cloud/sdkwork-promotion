import type { DiscountApplication } from './discount-application';
import type { PageInfo } from './page-info';

export interface DiscountApplicationListEnvelope {
  code: 0;
  data: { items: DiscountApplication[]; pageInfo: PageInfo; };
  traceId: string;
}
