import type { NoData } from './no-data';

/** MembercardsRetrieveResult schema exposed by Cloud Router. */
export interface MembercardsRetrieveResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
