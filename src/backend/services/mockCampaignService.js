async function mockCampaignService(payload) {
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

module.exports = {
  mockCampaignService,
};
