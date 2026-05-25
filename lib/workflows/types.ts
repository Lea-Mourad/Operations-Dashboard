import type { Prisma } from "@prisma/client";

import type { ValidationResult } from "@/lib/validation";

export type WorkflowActionDraft = {
  type: string;
  payload: Prisma.InputJsonValue;
};

export type WorkflowAuditDraft = {
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export type AdapterExecutionResult = {
  success: boolean;
  review_reason?: string;
  audit_logs: WorkflowAuditDraft[];
};

export interface WorkflowAdapter<TPayload extends Record<string, unknown>> {
  source: string;
  eventType: string;
  validate(payload: unknown): ValidationResult<TPayload>;
  buildActions(payload: TPayload): WorkflowActionDraft[];
  execute(
    payload: TPayload,
    actions: WorkflowActionDraft[],
  ): Promise<AdapterExecutionResult>;
}
