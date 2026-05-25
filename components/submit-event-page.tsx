"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import StatusBadge from "@/components/StatusBadge";
import {
  createAdvancedJsonDefault,
  createCampaignDefaults,
  createFinanceDefaults,
  createGuestDefaults,
} from "@/lib/dashboard/defaults";
import { emitOperationsRefresh, submitEvent } from "@/lib/dashboard/client";
import type { SubmitEventResponse } from "@/lib/dashboard/types";

type TabKey = "finance" | "campaign" | "guest" | "advanced";

type SubmitState = {
  loading: boolean;
  error: string | null;
  result: SubmitEventResponse | null;
};

export default function SubmitEventPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("finance");
  const [finance, setFinance] = useState(createFinanceDefaults);
  const [campaign, setCampaign] = useState(createCampaignDefaults);
  const [guest, setGuest] = useState(createGuestDefaults);
  const [advancedJson, setAdvancedJson] = useState(createAdvancedJsonDefault);
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false,
    error: null,
    result: null,
  });

  const tabs = useMemo(
    () => [
      { key: "finance" as const, title: "FinanceOps", subtitle: "Overdue Invoice" },
      { key: "campaign" as const, title: "CampaignOps", subtitle: "Client Brief" },
      { key: "guest" as const, title: "GuestOps", subtitle: "Reservation Change" },
      { key: "advanced" as const, title: "Advanced JSON", subtitle: "Raw editor" },
    ],
    [],
  );

  async function handleSubmission(payload: unknown) {
    setSubmitState({
      loading: true,
      error: null,
      result: null,
    });

    try {
      const result = await submitEvent(payload);
      emitOperationsRefresh();
      setSubmitState({
        loading: false,
        error: null,
        result,
      });

      if (!result.duplicate) {
        setFinance(createFinanceDefaults());
        setCampaign(createCampaignDefaults());
        setGuest(createGuestDefaults());
        setAdvancedJson(createAdvancedJsonDefault());
      }
    } catch (error) {
      setSubmitState({
        loading: false,
        error:
          error instanceof Error ? error.message : "Unable to submit event",
        result: null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Submit Event
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
          Guided workflow submission
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Submit structured operational events through compact guided forms. Advanced JSON mode remains available as a secondary operator tool for edge cases.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <section className="rounded-[10px] border border-[var(--border)] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Event type
          </p>
          <div className="grid gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[10px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                      : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[#f9fafb]"
                  }`}
                >
                  <p className="text-sm font-medium">{tab.title}</p>
                  <p className="mt-1 text-xs">{tab.subtitle}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4 text-sm text-[var(--text-secondary)]">
            Forms are preloaded with realistic sample defaults for fast demos.
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[10px] border border-[var(--border)] bg-white p-6">
            {activeTab === "finance" ? (
              <FinanceForm
                values={finance}
                onChange={setFinance}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: finance.source_event_id,
                    source: "financeops",
                    event_type: "invoice.overdue",
                    payload: {
                      invoice_id: finance.invoice_id,
                      customer_name: finance.customer_name,
                      amount: Number(finance.amount),
                      currency: finance.currency,
                      days_overdue: Number(finance.days_overdue),
                      simulate_failure: finance.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "campaign" ? (
              <CampaignForm
                values={campaign}
                onChange={setCampaign}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: campaign.source_event_id,
                    source: "campaignops",
                    event_type: "client_brief.received",
                    payload: {
                      client: campaign.client,
                      campaign_goal: campaign.campaign_goal,
                      channels: campaign.channels,
                      deadline: campaign.deadline,
                      simulate_failure: campaign.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "guest" ? (
              <GuestForm
                values={guest}
                onChange={setGuest}
                onSubmit={() =>
                  handleSubmission({
                    source_event_id: guest.source_event_id,
                    source: "guestops",
                    event_type: "reservation.change_requested",
                    payload: {
                      reservation_id: guest.reservation_id,
                      guest_name: guest.guest_name,
                      current_check_in: guest.current_check_in,
                      requested_check_in: guest.requested_check_in,
                      nights: Number(guest.nights),
                      simulate_failure: guest.simulate_failure,
                    },
                  })
                }
                loading={submitState.loading}
              />
            ) : null}

            {activeTab === "advanced" ? (
              <AdvancedJsonForm
                value={advancedJson}
                onChange={setAdvancedJson}
                onSubmit={() => handleSubmission(JSON.parse(advancedJson) as unknown)}
                loading={submitState.loading}
              />
            ) : null}
          </section>

          <SubmissionResult state={submitState} />
        </div>
      </div>
    </div>
  );
}

function FinanceForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createFinanceDefaults>;
  onChange: (next: ReturnType<typeof createFinanceDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="FinanceOps · Overdue Invoice"
      description="Create an overdue invoice event and let the workflow engine generate payment reminders and follow-up tasks."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="invoice_id" value={values.invoice_id} onChange={(value) => onChange({ ...values, invoice_id: value })} />
        <TextField label="customer_name" value={values.customer_name} onChange={(value) => onChange({ ...values, customer_name: value })} />
        <TextField label="currency" value={values.currency} onChange={(value) => onChange({ ...values, currency: value })} />
        <TextField label="amount" type="number" value={values.amount} onChange={(value) => onChange({ ...values, amount: value })} />
        <TextField label="days_overdue" type="number" value={values.days_overdue} onChange={(value) => onChange({ ...values, days_overdue: value })} />
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit FinanceOps event" />
    </FormLayout>
  );
}

function CampaignForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createCampaignDefaults>;
  onChange: (next: ReturnType<typeof createCampaignDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const channels = ["instagram", "email", "landing_page", "tiktok", "google_ads"] as const;

  return (
    <FormLayout
      title="CampaignOps · Client Brief"
      description="Capture a client brief and let the backend generate channel-specific campaign work items."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="client" value={values.client} onChange={(value) => onChange({ ...values, client: value })} />
        <TextField label="campaign_goal" value={values.campaign_goal} onChange={(value) => onChange({ ...values, campaign_goal: value })} />
        <TextField label="deadline" type="date" value={values.deadline} onChange={(value) => onChange({ ...values, deadline: value })} />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">channels</p>
        <div className="grid gap-3 md:grid-cols-2">
          {channels.map((channel) => (
            <label key={channel} className="flex items-center gap-3 rounded-[7px] border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={values.channels.includes(channel)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...values.channels, channel]
                    : values.channels.filter((entry) => entry !== channel);
                  onChange({ ...values, channels: next });
                }}
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit CampaignOps event" />
    </FormLayout>
  );
}

function GuestForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: ReturnType<typeof createGuestDefaults>;
  onChange: (next: ReturnType<typeof createGuestDefaults>) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="GuestOps · Reservation Change"
      description="Capture a reservation change request with enough booking context for downstream review and messaging."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="source_event_id" value={values.source_event_id} onChange={(value) => onChange({ ...values, source_event_id: value })} />
        <TextField label="reservation_id" value={values.reservation_id} onChange={(value) => onChange({ ...values, reservation_id: value })} />
        <TextField label="guest_name" value={values.guest_name} onChange={(value) => onChange({ ...values, guest_name: value })} />
        <TextField label="nights" type="number" value={values.nights} onChange={(value) => onChange({ ...values, nights: value })} />
        <TextField label="current_check_in" type="date" value={values.current_check_in} onChange={(value) => onChange({ ...values, current_check_in: value })} />
        <TextField label="requested_check_in" type="date" value={values.requested_check_in} onChange={(value) => onChange({ ...values, requested_check_in: value })} />
      </div>
      <CheckboxField label="simulate_failure" checked={values.simulate_failure} onChange={(checked) => onChange({ ...values, simulate_failure: checked })} />
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit GuestOps event" />
    </FormLayout>
  );
}

function AdvancedJsonForm({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <FormLayout
      title="Advanced JSON mode"
      description="Use raw JSON only when you need a custom shape or a backend edge-case demo."
    >
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Raw event JSON</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[340px] w-full bg-[#f9fafb] p-4 font-mono text-sm"
        />
      </label>
      <PrimaryButton onClick={onSubmit} loading={loading} label="Submit advanced JSON event" />
    </FormLayout>
  );
}

function SubmissionResult({ state }: { state: SubmitState }) {
  if (state.loading) {
    return (
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
        <p className="text-sm text-[var(--text-secondary)]">Submitting event...</p>
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-5">
        <p className="text-sm font-medium text-[#b91c1c]">{state.error}</p>
      </section>
    );
  }

  if (!state.result) {
    return (
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          Submit a guided event to see the operator result panel here.
        </p>
      </section>
    );
  }

  const event = state.result.event;

  return (
    <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Submission result
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">
            {state.result.duplicate ? "Existing event returned" : "Event accepted by API"}
          </h2>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ResultStat label="Source" value={event.source} />
        <ResultStat label="Event type" value={event.event_type} />
        <ResultStat label="Actions" value={String(event.actions.length)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/events/${event.id}`} className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">
          Open event detail
        </Link>
        <Link href="/events" className="rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]">
          Go to inbox
        </Link>
      </div>
    </section>
  );
}

function FormLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Guided form
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2.5 text-sm" />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[7px] border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[var(--text)]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function PrimaryButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading ? "Submitting..." : label}
    </button>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}
