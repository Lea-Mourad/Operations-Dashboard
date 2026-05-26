export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ActionRecord = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  payload: JsonValue;
};

export type AuditLogRecord = {
  id: string;
  message: string;
  created_at: string;
  metadata?: JsonValue | null;
};

export type ReviewQueueItemRecord = {
  id: string;
  event_id: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type EventRecord = {
  id: string;
  source_event_id: string;
  source: string;
  event_type: string;
  status: string;
  payload: JsonValue;
  created_at: string;
  updated_at: string;
  actions: ActionRecord[];
  review_queue_items: ReviewQueueItemRecord[];
  audit_logs: AuditLogRecord[];
};

export type ReviewListItem = {
  id: string;
  event_id: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  event: {
    id: string;
    source: string;
    source_event_id: string;
    event_type: string;
    status: string;
  };
};

export type AuditListItem = {
  id: string;
  message: string;
  created_at: string;
  metadata?: JsonValue | null;
  event: {
    id: string;
    source: string;
    source_event_id: string;
    event_type: string;
    status: string;
  };
};

export type EventsResponse = {
  events: EventRecord[];
};

export type ReviewsResponse = {
  reviewItems: ReviewListItem[];
};

export type AuditResponse = {
  auditItems: AuditListItem[];
};

export type DashboardResponse = {
  summary: {
    open_review_items: number;
    total_actions: number;
    total_events: number;
  };
  events_by_status: {
    status: string;
    count: number;
  }[];
  events_by_source: {
    source: string;
    count: number;
  }[];
};

export type EventResponse = {
  event: EventRecord;
};

export type SubmitEventResponse = {
  duplicate: boolean;
  event: EventRecord;
};

export type ResolveReviewResponse = {
  reviewItem: ReviewListItem;
};
