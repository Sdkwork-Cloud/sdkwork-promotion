import type { FieldError } from './field-error';
import type { SdkWorkPlatformErrorCode } from './sdk-work-platform-error-code';

export interface ProblemDetail {
  code: SdkWorkPlatformErrorCode;
  detail?: string;
  errors?: FieldError[];
  instance?: string;
  status: number;
  title: string;
  /** Server-owned request correlation id. */
  traceId: string;
  type: string;
}
