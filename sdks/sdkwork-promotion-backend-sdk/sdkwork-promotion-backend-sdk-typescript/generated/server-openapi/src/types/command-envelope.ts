export interface CommandEnvelope {
  code: 0;
  data: Record<string, unknown>;
  traceId: string;
}
