import type {
  DashboardResponse,
  EventResponse,
  EventsResponse,
  ResolveReviewResponse,
  ReviewsResponse,
  SubmitEventResponse,
} from "@/lib/dashboard/types";

export const operationsRefreshEvent = "operations-data:refresh";

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }

  return body as T;
}

export function emitOperationsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(operationsRefreshEvent));
  }
}

export function fetchEvents() {
  return fetchJson<EventsResponse>("/api/events");
}

export function fetchDashboard() {
  return fetchJson<DashboardResponse>("/api/dashboard");
}

export function fetchReviews() {
  return fetchJson<ReviewsResponse>("/api/reviews");
}

export function fetchEvent(id: string) {
  return fetchJson<EventResponse>(`/api/events/${id}`);
}

export function submitEvent(payload: unknown) {
  return fetchJson<SubmitEventResponse>("/api/events/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resolveReview(id: string, resolutionNotes: string) {
  return fetchJson<ResolveReviewResponse>(`/api/reviews/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      resolution_notes: resolutionNotes,
    }),
  });
}
