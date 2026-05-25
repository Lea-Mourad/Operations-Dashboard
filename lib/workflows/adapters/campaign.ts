import { mockCampaignService } from "@/lib/services/mockCampaignService";
import {
  sanitizeJsonValue,
  type ValidationResult,
} from "@/lib/validation";
import type { WorkflowAdapter, WorkflowActionDraft } from "@/lib/workflows/types";

export type CampaignPayload = {
  client: string;
  campaign_goal: string;
  channels: string[];
  deadline: string;
  include_final_qa?: boolean;
  simulate_failure?: boolean;
};

function validateCampaignPayload(
  payload: unknown,
): ValidationResult<CampaignPayload> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for CampaignOps"],
    };
  }

  const record = payload as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof record.client !== "string" || record.client.trim().length === 0) {
    errors.push("Missing or invalid payload field: client");
  }

  if (
    typeof record.campaign_goal !== "string" ||
    record.campaign_goal.trim().length === 0
  ) {
    errors.push("Missing or invalid payload field: campaign_goal");
  }

  if (
    !Array.isArray(record.channels) ||
    record.channels.length === 0 ||
    record.channels.some(
      (channel) => typeof channel !== "string" || channel.trim().length === 0,
    )
  ) {
    errors.push("Missing or invalid payload field: channels");
  }

  if (
    typeof record.deadline !== "string" ||
    record.deadline.trim().length === 0
  ) {
    errors.push("Missing or invalid payload field: deadline");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      client: record.client as string,
      campaign_goal: record.campaign_goal as string,
      channels: (record.channels as string[]).map((channel) => channel.trim()),
      deadline: record.deadline as string,
      include_final_qa:
        typeof record.include_final_qa === "boolean"
          ? record.include_final_qa
          : true,
      simulate_failure:
        typeof record.simulate_failure === "boolean"
          ? record.simulate_failure
          : undefined,
    },
  };
}

function toTaskTitle(channel: string, client: string) {
  const normalized = channel.trim().toLowerCase();

  switch (normalized) {
    case "instagram":
      return `Instagram creative brief for ${client}`;
    case "email":
      return `Email copy brief for ${client}`;
    case "landing page":
    case "landing_page":
      return `Landing page content brief for ${client}`;
    default:
      return `${channel} execution brief for ${client}`;
  }
}

function buildCampaignActions(payload: CampaignPayload): WorkflowActionDraft[] {
  const channelActions = payload.channels.map((channel) => ({
    type: "create_campaign_task",
    payload: sanitizeJsonValue({
      client: payload.client,
      channel,
      campaign_goal: payload.campaign_goal,
      deadline: payload.deadline,
      title: toTaskTitle(channel, payload.client),
    }),
  }));

  if (payload.include_final_qa === false) {
    return channelActions;
  }

  return [
    ...channelActions,
    {
      type: "create_campaign_task",
      payload: sanitizeJsonValue({
        client: payload.client,
        channel: "qa",
        deadline: payload.deadline,
        title: `Final QA review for ${payload.client}`,
      }),
    },
  ];
}

export const campaignAdapter: WorkflowAdapter<CampaignPayload> = {
  source: "campaignops",
  eventType: "client_brief.received",
  validate: validateCampaignPayload,
  buildActions: buildCampaignActions,
  async execute(payload) {
    const result = await mockCampaignService(payload);

    if (!result.success) {
      return {
        success: false,
        review_reason: result.message,
        audit_logs: [
          {
            message: "CampaignOps mock service failed",
            metadata: sanitizeJsonValue(result.metadata ?? {}),
          },
        ],
      };
    }

    return {
      success: true,
      audit_logs: [
        {
          message: "CampaignOps workflow executed",
          metadata: sanitizeJsonValue(result.metadata ?? {}),
        },
      ],
    };
  },
};
