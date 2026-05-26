async function mockGuestService(payload) {
  if (payload.simulate_failure === true) {
    return {
      success: false,
      message: "GuestOps mock service failed intentionally",
      metadata: {
        reservation_id: payload.reservation_id,
      },
    };
  }

  return {
    success: true,
    message: "GuestOps reservation workflow executed",
    metadata: {
      reservation_id: payload.reservation_id,
      guest_name: payload.guest_name,
    },
  };
}

module.exports = {
  mockGuestService,
};
