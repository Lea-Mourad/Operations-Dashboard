import type { MockServiceResult } from "@/lib/services/mockFinanceService";

type GuestPayload = {
  reservation_id: string;
  guest_name: string;
  requested_check_in: string;
  simulate_failure?: boolean;
};

export async function mockGuestService(
  payload: GuestPayload,
): Promise<MockServiceResult> {
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
