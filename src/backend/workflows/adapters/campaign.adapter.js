const { mockCampaignService } = require("../../services/mockCampaignService");
const { sanitizeJsonValue } = require("../../services/workflowUtils");

function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for CampaignOps"],
    };
  }

  const errors = [];

  if (typeof payload.client !== "string" || payload.client.trim().length === 0) {
    errors.push("Missing or invalid payload field: client");
  }

  if (
    typeof payload.campaign_goal !== "string" ||
    payload.campaign_goal.trim().length === 0
  ) {
    errors.push("Missing or invalid payload field: campaign_goal");
  }

  if (
    !Array.isArray(payload.channels) ||
    payload.channels.length === 0 ||
    payload.channels.some(
      (channel) => typeof channel !== "string" || channel.trim().length === 0,
    )
  ) {
    errors.push("Missing or invalid payload field: channels");
  }

  if (
    typeof payload.deadline !== "string" ||
    payload.deadline.trim().length === 0
  ) {
    errors.push("Missing or invalid payload field: deadline");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      client: payload.client,
      campaign_goal: payload.campaign_goal,
      channels: payload.channels.map((channel) => channel.trim()),
      deadline: payload.deadline,
      include_final_qa:
        typeof payload.include_final_qa === "boolean"
          ? payload.include_final_qa
          : true,
      simulate_failure:
        typeof payload.simulate_failure === "boolean"
          ? payload.simulate_failure
          : undefined,
    },
  };
}

function toTaskTitle(channel, client) {
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

function buildActions(payload) {
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

async function execute(payload) {
  const result = await mockCampaignService(payload);

  if (!result.success) {
    return {
      success: false,
      review_reason: result.message,
      audit_logs: [
        {
          message: "CampaignOps mock service failed",
          metadata: sanitizeJsonValue(result.metadata || {}),
        },
      ],
    };
  }

  return {
    success: true,
    audit_logs: [
      {
        message: "CampaignOps workflow executed",
        metadata: sanitizeJsonValue(result.metadata || {}),
      },
    ],
  };
}

module.exports = {
  campaignAdapter: {
    source: "campaignops",
    eventType: "client_brief.received",
    validate,
    buildActions,
    execute,
  },
};
