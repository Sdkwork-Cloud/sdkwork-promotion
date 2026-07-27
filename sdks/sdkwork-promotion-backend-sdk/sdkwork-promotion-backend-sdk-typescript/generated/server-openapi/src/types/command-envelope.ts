export interface CommandEnvelope {
  code: 0;
  data: { accepted: boolean; resourceId?: string; status?: string; };
  traceId: string;
}
