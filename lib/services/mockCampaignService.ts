import type { MockServiceResult } from "@/lib/services/mockFinanceService";

type CampaignPayload = {
  client: string;
  campaign_goal: string;
  channels: string[];
  deadline: string;
  include_final_qa?: boolean;
  simulate_failure?: boolean;
};

export async function mockCampaignService(
  payload: CampaignPayload,
): Promise<MockServiceResult> {
  if (payload.simulate_failure === true) {
    return {
      success: false,
      message: "CampaignOps mock service failed intentionally",
      metadata: {
        client: payload.client,
      },
    };
  }

  return {
    success: true,
    message: "CampaignOps tasks dispatched",
    metadata: {
      client: payload.client,
      task_count:
        payload.channels.length + (payload.include_final_qa === false ? 0 : 1),
    },
  };
}
