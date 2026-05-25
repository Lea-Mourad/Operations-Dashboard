import { campaignAdapter } from "@/lib/workflows/adapters/campaign";
import { financeAdapter } from "@/lib/workflows/adapters/finance";
import { guestAdapter } from "@/lib/workflows/adapters/guest";

export const workflowAdapters = [
  financeAdapter,
  campaignAdapter,
  guestAdapter,
] as const;
