import type { NoData } from './no-data';

/** MembercardsListResult schema exposed by Cloud Router. */
export interface MembercardsListResult {
  code: 0;
  data: unknown & NoData;
  /** Server-owned request correlation id. */
  traceId: string;
}
